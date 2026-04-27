class HttpClient {
  constructor(baseURL = "http://localhost:8001") {
    this.baseURL = baseURL;
  }

  async request(method, endpoint, data = null) {
    const config = {
      method,
    };

    if (data instanceof FormData) {
      config.body = data;
    } else if (data) {
      config.headers = { "Content-Type": "application/json" };
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  }

  get(endpoint) {
    return this.request("GET", endpoint);
  }

  post(endpoint, data) {
    return this.request("POST", endpoint, data);
  }

  patch(endpoint, data) {
    return this.request("PATCH", endpoint, data);
  }

  delete(endpoint) {
    return this.request("DELETE", endpoint);
  }
}

export default HttpClient;
