interface ServiceConfig
{
  model?: {[key: string]: any};
  name?: string;
  repos?: {[key: string]: any};
  services?: {[key: string]: any};
}

export default class Service
{
  config: ServiceConfig;
  name: string;
  repos: {[key: string]: any};
  services: {[key: string]: any};
  
  constructor(options: ServiceConfig = {}) {
    this.config = options;
    this.config.model = this.config.model ? this.config.model : {}; // The main config is injected here
    this.config.name = this.config.name ? this.config.name : '';
    this.config.repos = this.config.repos ? this.config.repos : {};
    this.config.services = this.config.services ? this.config.services : {};

    this.name = this.config.name ? this.config.name : this.constructor.name;
    this.repos = {};
    this.services = {};

    if (this.config.repos) this.addRepos(this.config.repos);
    if (this.config.services) this.addServices(this.config.services);
  }
  init()
  {
    // This method might need to do async work at some point we return a promise
    return Promise.resolve();
  }
  addRepo(repo)
  {
    if (repo.getName) {
      this.repos[repo.getName()] = repo;
    } else {
      throw new Error('Attempting to add invalid repo to service');
    }
  }
  addRepos(repos)
  {
    if (repos) {
      if (Array.isArray(repos)) {
        repos.forEach(repo => {
          this.addRepo(repo);
        });
      } else {
        Object.keys(repos).forEach(repoName => {
          this.addRepo(repos[repoName]);
        });
      }
    }
  }
  addService(service)
  {
    if (service.getName) {
      this.services[service.getName()] = service;
    } else {
      throw new Error('Attempting to add invalid service to service');
    }
  }
  addServices(services)
  {
    if (services) {
      if (Array.isArray(services)) {
        services.forEach((service) => {
          this.addService(service);
        });
      } else {
        Object.keys(services).forEach((serviceName) => {
          this.addService(services[serviceName]);
        });
      }
    }
  }
  getName()
  {
    // If service name == 'Service' then we are most likely using the name of the default service constrcutor.
    // This can cause problems because services are referred to by name in the model and if we have multiple
    // services named 'Service' we could not be sure which one we are working with
    // For this reason we do not permit a service to be named 'Service'
    if (this.name == 'Service') throw new Error('Service name not configured - you must specify a service name when using the default service constructor');
    return this.name;
  }
  getRepo(name)
  {
    return this.repos[name];
  }
  getService(name)
  {
    return this.services[name];
  }
}
