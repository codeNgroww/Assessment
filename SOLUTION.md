<!-- <Solution/>  -->

<!-- Backend -->

✅ 1. Refactor Blocking I/O
Replace fs.readFileSync in src/routes/items.js with fs.promises.readFile and use async/await to make file reading non-blocking and improve performance.

✅ 2. Optimize /api/stats
Avoid recalculating stats on every request. Cache the result in memory and use fs.watchFile to update the cache automatically whenever the data file changes.

✅ 3. Use Jest  to write tests for the /items route, covering:

Happy path: Valid request returns item list.
Error case: Simulate file read failure and ensure it returns a 500 error.

<!-- frontend  -->

✅ 1.To prevent a memory leak when the component unmounts before the fetch completes, use an abort mechanism. This ensures the fetch request is canceled if the component is no longer in the DOM. This avoids trying to update state on an unmounted component, which can lead to memory leaks or console warnings.

✅ 2. Pagination & Search (Client and Server)
Server Side:

Implement server-side pagination and search by accepting query parameters (q, page, limit) in the API endpoint. Filter the items based on the search term (q) and return only a specific subset (based on page and limit) of the full item list.

Client Side:

On the frontend, build a paginated UI with a search input. When the user types or changes pages, send the current search term and page number to the server using query parameters. Update the UI with the paginated, filtered response received from the server.

✅ 3. Performance Optimization (Virtualization)
If the item list is large, render performance can degrade. Use virtualization libraries like react-window on the client side to only render visible rows/items in the DOM. This drastically improves UI responsiveness and memory usage for large lists.