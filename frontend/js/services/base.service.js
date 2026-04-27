class BaseService {
  constructor(http, resource) {
    this.http = http;
    this.resource = resource;
  }

  buildPath(id = "") {
    return id
      ? `/${this.resource}/${id}`
      : `/${this.resource}`;
  }

  getAll() {
    return this.http.get(this.buildPath());
  }

  get(id) {
    return this.http.get(this.buildPath(id));
  }

  create(data) {
    return this.http.post(this.buildPath(), data);
  }

  update(id, data) {
    return this.http.patch(this.buildPath(id), data);
  }

  delete(id) {
    return this.http.delete(this.buildPath(id));
  }
}

export default BaseService;
