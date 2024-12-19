package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
)

type Request struct {
	Input [20][20]int `json:"input"` // Grid input where 1 = walkable and 0 = blocked
	Query struct {
		Start []int `json:"start"` // Start coordinates [i, j]
		End   []int `json:"end"`   // End coordinates [i, j]
	} `json:"query"` 
}

type Visited [20][20]bool

var directions = [][2]int{{0, 1}, {1, 0}, {0, -1}, {-1, 0}} // right, down, left, up

// DFS function to find a path in the matrix
func dfs(current []int, target []int, visited Visited, path [][]int, grid [20][20]int) ([][]int, bool) {
	// Boundary checks and check if the cell is walkable
	if current[0] < 0 || current[0] >= 20 || current[1] < 0 || current[1] >= 20 || visited[current[0]][current[1]] || grid[current[0]][current[1]] == 0 {
		return nil, false
	}

	visited[current[0]][current[1]] = true
	path = append(path, []int{current[0], current[1]})

	// Check if we've reached the target
	if current[0] == target[0] && current[1] == target[1] {
		return path, true
	}

	// Explore the neighbors
	for _, dir := range directions {
		next := []int{current[0] + dir[0], current[1] + dir[1]}
		if p, found := dfs(next, target, visited, path, grid); found {
			return p, true
		}
	}

	// Backtrack if not found
	visited[current[0]][current[1]] = false
	return nil, false
}

// Handler to process input requests
func getInput(w http.ResponseWriter, r *http.Request) {
	// Content-Type and body size enforcement
	ct := r.Header.Get("Content-Type")
	if ct != "" {
		mediaType := strings.ToLower(strings.TrimSpace(strings.Split(ct, ";")[0]))
		if mediaType != "application/json" {
			http.Error(w, "Content-Type header is not application/json", http.StatusUnsupportedMediaType)
			return
		}
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1048576)

	var req Request
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	// Decode JSON body
	err := dec.Decode(&req)
	if err != nil {
		var syntaxError *json.SyntaxError
		var unmarshalTypeError *json.UnmarshalTypeError

		switch {
		case errors.As(err, &syntaxError):
			http.Error(w, fmt.Sprintf("Request body contains badly-formed JSON (at position %d)", syntaxError.Offset), http.StatusBadRequest)
		case errors.Is(err, io.ErrUnexpectedEOF):
			http.Error(w, "Request body contains badly-formed JSON", http.StatusBadRequest)
		case errors.As(err, &unmarshalTypeError):
			http.Error(w, fmt.Sprintf("Request body contains an invalid value for the %q field (at position %d)", unmarshalTypeError.Field, unmarshalTypeError.Offset), http.StatusBadRequest)
		case strings.HasPrefix(err.Error(), "json: unknown field "):
			http.Error(w, fmt.Sprintf("Request body contains unknown field %s", strings.TrimPrefix(err.Error(), "json: unknown field ")), http.StatusBadRequest)
		case errors.Is(err, io.EOF):
			http.Error(w, "Request body must not be empty", http.StatusBadRequest)
		case err.Error() == "http: request body too large":
			http.Error(w, "Request body must not be larger than 1MB", http.StatusRequestEntityTooLarge)
		default:
			log.Print(err.Error())
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
		return
	}
	
	// Check for extra data in the request body
	err = dec.Decode(&struct{}{})
	if !errors.Is(err, io.EOF) {
		http.Error(w, "Request body must only contain a single JSON object", http.StatusBadRequest)
		return
	}

	// Start DFS to find the path
	visited := Visited{}
	start := req.Query.Start
	end := req.Query.End

	// Pathfinding with DFS, considering the grid
	path, found := dfs(start, end, visited, nil, req.Input)
	if !found {
		http.Error(w, "No path found.", http.StatusNotFound)
		return
	}

	// Return the path found as a JSON response
	response, err := json.Marshal(path)
	if err != nil {
		http.Error(w, "Could not encode response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(response)
}

func main() {
	fmt.Println("Server started")
	mux := http.NewServeMux()
	mux.HandleFunc("/input", getInput)
	log.Fatal(http.ListenAndServe(":4000", mux))
}