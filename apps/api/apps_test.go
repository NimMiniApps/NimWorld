package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestLoadManifestsSkipsUnusableFiles(t *testing.T) {
	dir := t.TempDir()
	write := func(name, body string) {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(body), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	write("good.json", `{"schemaVersion":1,"id":"good","name":"Good","launchUrl":"https://good.local"}`)
	write("broken.json", `{not json`)
	write("incomplete.json", `{"schemaVersion":1,"id":"x"}`)
	write("wrong-version.json", `{"schemaVersion":99,"id":"y","name":"Y","launchUrl":"https://y.local"}`)
	write("notes.txt", `ignored`)

	manifests := loadManifests(dir)
	if len(manifests) != 1 {
		t.Fatalf("got %d manifests, want only the valid one", len(manifests))
	}
	var got map[string]any
	if err := json.Unmarshal(manifests[0], &got); err != nil {
		t.Fatal(err)
	}
	if got["id"] != "good" {
		t.Fatalf("got id %v, want good", got["id"])
	}
}

func TestLoadManifestsMissingDirIsNotFatal(t *testing.T) {
	if manifests := loadManifests(filepath.Join(t.TempDir(), "nope")); len(manifests) != 0 {
		t.Fatalf("got %d manifests, want none", len(manifests))
	}
}

// The repo's own manifests are what the client bundles; the API must serve them.
func TestLoadManifestsReadsTheSharedDirectory(t *testing.T) {
	manifests := loadManifests(defaultManifestDir)
	if len(manifests) < 2 {
		t.Fatalf("got %d manifests from %s, want the shared nimbomber + playnimiq", len(manifests), defaultManifestDir)
	}
}

func TestHandleApps(t *testing.T) {
	s := &server{manifests: []json.RawMessage{json.RawMessage(`{"id":"nimbomber"}`)}}
	rec := httptest.NewRecorder()
	s.handleApps(rec, httptest.NewRequest(http.MethodGet, "/apps", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("got %d, want 200", rec.Code)
	}
	var body appsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if len(body.Apps) != 1 {
		t.Fatalf("got %d apps, want 1", len(body.Apps))
	}
}

// An empty registry answers with a list, never `null`, so clients can iterate.
func TestHandleAppsWithoutManifests(t *testing.T) {
	s := &server{}
	rec := httptest.NewRecorder()
	s.handleApps(rec, httptest.NewRequest(http.MethodGet, "/apps", nil))

	var body struct {
		Apps []json.RawMessage `json:"apps"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Apps == nil {
		t.Fatal("apps should be an empty array, not null")
	}
}

func TestHandleWorldServesTheConfiguredTipAddress(t *testing.T) {
	s := &server{tipAddress: "NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C"}
	rec := httptest.NewRecorder()
	s.handleWorld(rec, httptest.NewRequest(http.MethodGet, "/world", nil))

	var body worldResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.TipAddress != s.tipAddress || body.Version != 1 {
		t.Fatalf("got %+v, want version 1 and the configured address", body)
	}
}

func TestConfiguredTipAddressRejectsGarbage(t *testing.T) {
	t.Setenv("TIP_ADDRESS", "not-an-address")
	if got := configuredTipAddress(); got != normalizeNimiqAddress(fallbackTipAddress) {
		t.Fatalf("got %q, want the fallback", got)
	}

	t.Setenv("TIP_ADDRESS", "nq57 7nbs gkf1 r9b8 chf1 0p92 67vg 02ff al5c")
	if got := configuredTipAddress(); got != "NQ577NBSGKF1R9B8CHF10P9267VG02FFAL5C" {
		t.Fatalf("got %q, want the normalized address", got)
	}
}
