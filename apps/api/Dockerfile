FROM golang:1.25-alpine AS build
WORKDIR /app
COPY apps/api/go.mod apps/api/go.sum ./
RUN go mod download
COPY apps/api ./
RUN CGO_ENABLED=0 go build -o /api .

FROM alpine:3.20
COPY --from=build /api /api
EXPOSE 8081
ENTRYPOINT ["/api"]
