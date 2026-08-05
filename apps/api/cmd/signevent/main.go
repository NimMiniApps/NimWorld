// Command signevent posts a signed app event to a NimWorld API, the way a
// Mini App's *server* would. It exists to make the trusted-write path
// runnable in one command — for smoke tests, and as a reference for app
// developers porting the four lines of HMAC into their own backend.
//
//	go run ./cmd/signevent -app nimbomber -secret s3cret \
//	  -address "NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C" \
//	  -type score.posted -text "scored 4,200" -public
package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

func main() {
	url := flag.String("url", "http://localhost:8081/events", "NimWorld events endpoint")
	app := flag.String("app", "", "app id, matching its entry in APP_KEYS")
	secret := flag.String("secret", "", "that app's shared secret")
	address := flag.String("address", "", "the player's Nimiq address")
	eventType := flag.String("type", "score.posted", "event type")
	text := flag.String("text", "", "one public line, e.g. \"scored 4,200\"")
	public := flag.Bool("public", false, "show this line in the plaza activity feed")
	data := flag.String("data", "", "optional JSON payload for the app's own use")
	flag.Parse()

	if *app == "" || *secret == "" || *address == "" {
		log.Fatal("-app, -secret and -address are required")
	}

	payload := map[string]any{
		"address": *address,
		"type":    *eventType,
		"ts":      time.Now().Unix(),
		"public":  *public,
		"text":    *text,
	}
	if *data != "" {
		payload["data"] = json.RawMessage(*data)
	}
	body, err := json.Marshal(payload)
	if err != nil {
		log.Fatal(err)
	}

	// The signature covers the exact bytes on the wire — sign the serialized
	// body, never a re-marshalled copy of it.
	mac := hmac.New(sha256.New, []byte(*secret))
	mac.Write(body)

	req, err := http.NewRequest(http.MethodPost, *url, bytes.NewReader(body))
	if err != nil {
		log.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-App-Id", *app)
	req.Header.Set("X-App-Signature", hex.EncodeToString(mac.Sum(nil)))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()
	out, _ := io.ReadAll(resp.Body)
	fmt.Printf("%s %s\n", resp.Status, bytes.TrimSpace(out))
	if resp.StatusCode != http.StatusAccepted {
		log.Fatal("event rejected")
	}
}
