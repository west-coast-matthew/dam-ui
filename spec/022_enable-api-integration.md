status: ready

# 022 — enable-api-integration

## Summary

we need to begin supporting the ability to integrate with and api backend. this will be driven by a new env property 'REACT_APP_API_URL'.

modify the services to use that value when present to determine the root api location.

the ../dam-api project will service the endpoints. for defined existing services, use those actual endpoints to drive the ui

