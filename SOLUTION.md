# Summary of the Proposed Solutions  

## Server-Side Item Management using Node.js and Express Backend  

### Overview  

- **Search and Pagination:**

  - Implemented on the `/api/items` endpoint for searching and paginating items.

  - `page`, `limit`, and `q` parameters are accepted.

  - Metadata is also provided such as the current page and total pages together with the paginated items.  

- **Error Management:**

  - Uniform error responses as JSON are provided using the `message` property to enhance testing.

  - Specific 404 and 500 error responses are returned explicitly in route handlers.  

- **System Performance:**

  - Node.js file system library and promises provide async functionality to processes (non-blocking file I/O).

  - Stats endpoints utilize caching as well as file watching to minimize redundant calculations.  

- **Test Cases:**

  - Updated to match the new API response structure, extensive Jest tests covering all edges and happy paths ensure reliable outcomes.   

### Considerations for This Approach  

- **Challenges with file-based storage**

  - Easy to reason about and implement, however, not suitable for a large dataset.

  - Lack of transaction safety enables write concurrency to potentially corrupt datasets.  

- **Memory Based Pagination:**

  - Works effectively with small datasets due to the requirement to load all information into memory per request.

- **No Input Validation:**
  
  - As an example, we will not validate the payload; a production system should always validate the payload using schema validation via a schema validator such as Joi or Yup.

