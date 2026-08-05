package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
)

// The manifest directory is the same one the TS package imports from, so an
// app is described in exactly one place. MANIFEST_DIR overrides it for
// deployments where the repo layout is not around the binary.
const defaultManifestDir = "../../packages/app-manifest/src/manifests"

type appManifest struct {
	SchemaVersion int    `json:"schemaVersion"`
	ID            string `json:"id"`
	Name          string `json:"name"`
	LaunchURL     string `json:"launchUrl"`
	// Everything else rides along untouched: the API is a registry, not the
	// schema owner. packages/app-manifest validates the full shape.
}

type appsResponse struct {
	Apps []json.RawMessage `json:"apps"`
}

// loadManifests reads every *.json in dir once at startup. A malformed or
// incomplete file is logged and skipped rather than taking the API down.
func loadManifests(dir string) []json.RawMessage {
	entries, err := os.ReadDir(dir)
	if err != nil {
		log.Printf("manifests: %v (serving none)", err)
		return nil
	}

	names := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() && filepath.Ext(entry.Name()) == ".json" {
			names = append(names, entry.Name())
		}
	}
	sort.Strings(names) // stable order for callers and tests

	manifests := make([]json.RawMessage, 0, len(names))
	for _, name := range names {
		data, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil {
			log.Printf("manifests: %s: %v", name, err)
			continue
		}
		var m appManifest
		if err := json.Unmarshal(data, &m); err != nil {
			log.Printf("manifests: %s: %v", name, err)
			continue
		}
		if m.SchemaVersion != 1 || m.ID == "" || m.Name == "" || m.LaunchURL == "" {
			log.Printf("manifests: %s: missing required fields, skipped", name)
			continue
		}
		manifests = append(manifests, json.RawMessage(data))
	}
	return manifests
}

func manifestDir() string {
	if dir := os.Getenv("MANIFEST_DIR"); dir != "" {
		return dir
	}
	return defaultManifestDir
}

// handleApps lists the app manifests this world knows about. Public: a manifest
// is what an app publishes about itself.
func (s *server) handleApps(w http.ResponseWriter, r *http.Request) {
	if s.manifests == nil {
		writeJSON(w, http.StatusOK, appsResponse{Apps: []json.RawMessage{}})
		return
	}
	writeJSON(w, http.StatusOK, appsResponse{Apps: s.manifests})
}
