# Favicon Scraper API

This project is a favicon scraper API built with Express. It provides endpoints for getting favicons from a specified URL, retrieving analytics, getting cached icons, and clearing the cache.

[Demo](https://www.faviconscraper.mc.hzuccon.com/#/)

And SDK is available [here](https://www.npmjs.com/package/favicons-scraper) ([Source](https://github.com/harvmaster/sdk.favicons-scraper))

## Config

The configuration for this project is stored in a TypeScript file named `config.ts`. It looks like this:

```ts
const config = {
  admin: {
    password: '',
  },
  server: {
    port: 3000,
  },
}

export default config
```

You can adjust the configuration values as needed for your environment.

## Endpoints

- **Get Favicons:**  
  ```
  GET /icons?url="yourURL"
  ```

- **Get Analytics:**  
  ```
  GET /analytics?password="adminPassword"
  ```

- **Get Cached Icons:**  
  ```
  GET /analytics/cache
  ```

- **Clear Cache:**  
  ```
  GET /analytics/cache/clear?password="adminPassword"
  ```

## Tools Used

This project uses Axios for fetching favicons from the specified URL, with Puppeteer as a failover option in case Axios fails.

## Usage

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/favicon-scraper-api.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Access the API endpoints as described above.

## Contributing

Contributions are welcome! Please create a new branch for your changes and submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.