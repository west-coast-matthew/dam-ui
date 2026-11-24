status: completed

# 022 — enable-api-integration

## Summary

We need to begin supporting the ability to integrate with an API backend. This will be driven by a new env property 'REACT_APP_API_URL'.

Modify the services to use that value when present to determine the root API location.

The ../dam-api project will service the endpoints. For defined existing services, use those actual endpoints to drive the UI.

