# Broad Description

a vscode extension that can load a mockoon environment json file and allows the user to edit the file without having to use the standalone mockoon application.

# Ecluded Features (will not do)

- import/export of openapi specifications
- start/stop mock servers
- adding and deleting routes

# Features (User Stories)

- when i open a mockoon environment file in my json editor, i see a button to open the file in the mockoon extension.

## In the mockoon extension view

- i can edit the following global environment settings: [port, latency]
- i can see the list of routes
- when i click on a route, i can access the detail panel of the route.

### In the route detail panel

- i can edit the routes responses, both the body and the headers.
- i can see the response bodi in an editor that supports syntax highlighting and formatting, ideally same as vscode.
- i can add new responses to the route.
- i can select which response is the default response for the route.

# Technical Requirements

the code should be writtend like a weekend project, not an enterprize product.
will need high locality of behavior, low levels of abstraction, be declarative instead of imperative, in not only in the function usage (like .forEach over for loops) but also in the design, minimizing manual state management and using reactive programming patterns where possible.

testing is not a requirement.