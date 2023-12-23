import { query, update, Record, Canister, text, StableBTreeMap, None, Some, Vec, Result, nat64, nat16, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

const Education = Record({
  degree: text,
  school: text,
  graduationYear: nat16,
})

const Experience = Record({
  experienceId: text,
  position: text,
  startTime: nat64,
  endTime: nat64,
  description: text,
})

const ExperiencePayload = Record({
  position: text,
  startTime: nat64,
  endTime: nat64,
  description: text,
})

const Project = Record({
  projectId: text,
  role: text,
  description: text,
  techStack: Vec(text),
})

const ProjectPayload = Record({
  role: text,
  description: text,
  techStack: Vec(text),
})

const Portfolio = Record({
  portfolioId: text,
  education: Education,
  experiences: Vec(Experience),
  projects: Vec(Project),
  createdAt: nat64,
  updatedAt: Opt(nat64),
})

const PortfolioPayload = Record({
  title: text,
  body: text,
  attachmentURL: text,
})

const portfolioStorage = StableBTreeMap(text, Portfolio, 0);

export default Canister({
  getPortfolios: query([], Result(Vec(Portfolio), text), () => {
    return Result.Ok(portfolioStorage.values());
  }),

  getPortfolio: query([text], Result(Portfolio, text), (id) => {
    if (!portfolioStorage.containsKey(id)) {
      return Result.Err(`a portfolio with id=${id} not found`)
    }
    const portfolio = portfolioStorage.get(id).Some;

    return Result.Ok(portfolio);
  }),

  addEmptyPortfolio: update([PortfolioPayload], Result(Portfolio, text), (payload) => {
    const education: typeof Education = { degree: "", school: "", graduationYear: 0 }
    const portfolio: typeof Portfolio = { portfolioId: uuidv4(), education: education, experiences: [], projects: [], createdAt: ic.time(), updatedAt: None, ...payload };
    portfolioStorage.insert(portfolio.portfolioId, portfolio);
    return Result.Ok(portfolio);
  }),

  addExperience: update([text, ExperiencePayload], Result(Portfolio, text), (portfolioId, payload) => {
    const portfolio = portfolioStorage.get(portfolioId).Some;

    const experience: typeof Experience = {experienceId: uuidv4(), ...payload}

    portfolio.experiences.push(experience);
    portfolioStorage.insert(portfolio.portfolioId, portfolio);
    return Result.Ok(portfolio);
  }),

  addProject: update([text, ProjectPayload], Result(Portfolio, text), (portfolioId, payload) => {
    const portfolio = portfolioStorage.get(portfolioId).Some;

    const project: typeof Project = {projectId: uuidv4(), ...payload}

    portfolio.projects.push(project);
    portfolioStorage.insert(portfolio.portfolioId, portfolio);
    return Result.Ok(portfolio);
  }),

  updatePortfolio: update([text, PortfolioPayload], Result(Portfolio, text), (id, payload) => {
    if (!portfolioStorage.containsKey(id)) {
      return Result.Err(`couldn't update a portfolio with id=${id}. portfolio not found`)
    }

    const portfolio: typeof Portfolio = portfolioStorage.get(id).Some;
    const updatedPortfolio: typeof Portfolio = { ...portfolio, ...payload, updatedAt: Some(ic.time()) };
    portfolioStorage.insert(portfolio.portfolioId, updatedPortfolio);

    return Result.Ok(updatedPortfolio);
  }),

  // updateExperience: update([text, text, ExperiencePayload], Result(Portfolio, text), (portfolioId, experienceId, payload) => {
  //   if (!portfolioStorage.containsKey(portfolioId)) {
  //     return Result.Err(`couldn't update a portfolio with id=${portfolioId}. portfolio not found`)
  //   }
  //   const portfolio: typeof Portfolio = portfolioStorage.get(portfolioId).Some;

  //   if (!portfolio.experiences.find(item => item.experienceId === experienceId)) {
  //     return Result.Err(`couldn't update a portfolio with id=${portfolioId}. experience with id=${experienceId} not found`)
  //   }

  //   const experience = portfolio.experiences.filter(item => item.experienceId !== "2");
  //   const updatedExperiences = { ...experience, ...payload }
  //   const updatedPortfolio = { ...portfolio, experiences: updatedExperiences, updatedAt: Some(ic.time()) };
  //   portfolioStorage.insert(portfolio.portfolioId, updatedPortfolio);

  //   return Result.Ok(updatedPortfolio);
  // }),

  // updateProject: update([text, text, ProjectPayload], Result(Portfolio, text), (portfolioId, projectId, payload) => {
  //   if (!portfolioStorage.containsKey(portfolioId)) {
  //     return Result.Err(`couldn't update a portfolio with id=${portfolioId}. portfolio not found`)
  //   }
  //   const portfolio: typeof Portfolio = portfolioStorage.get(portfolioId).Some;

  //   if (!portfolio.projects.find(item => item.projectId === projectId)) {
  //     return Result.Err(`couldn't update a portfolio with id=${portfolioId}. project with id=${projectId} not found`)
  //   }

  //   const project: typeof Vec(Project) = portfolio.projects.find(item => item.projectId === projectId);
  //   const updatedProjects = { ...project, ...payload }
  //   const updatedPortfolio = { ...portfolio, projects: updatedProjects, updatedAt: Some(ic.time()) };
  //   portfolioStorage.insert(portfolio.portfolioId, updatedPortfolio);

  //   return Result.Ok(updatedPortfolio);
  // }),

  deletePortfolio: update([text], Result(Portfolio, text), (id) => {
    if (!portfolioStorage.containsKey(id)) {
      return Result.Err(`couldn't delete a portfolio with id=${id}. portfolio not found.`)
    }

    const deletedPortfolio = portfolioStorage.remove(id);
    return Result.Ok(deletedPortfolio);
  }),

  deleteExperience: update([text, text], Result(Portfolio, text), (portfolioId, experienceId) => {
    if (!portfolioStorage.containsKey(portfolioId)) {
      return Result.Err(`couldn't delete a portfolio with id=${portfolioId}. portfolio not found.`)
    }

    const portfolio: typeof Portfolio = portfolioStorage.get(portfolioId).Some;
    if (!portfolio.experiences.find(item => item.experienceId === experienceId)) {
      return Result.Err(`couldn't delete an experience at portfolio with id=${portfolioId}. experience not found.`)
    }

    const updatedExperiences = portfolio.experiences.filter((item: typeof Experience) => item.experienceId !== experienceId)
    const updatedPortfolio: typeof Portfolio = { ...portfolio, experiences: updatedExperiences, updatedAt: Some(ic.time()) };
    portfolioStorage.insert(portfolio.portfolioId, updatedPortfolio);

    return Result.Ok(updatedPortfolio);
  }),

  deleteProject: update([text, text], Result(Portfolio, text), (portfolioId, projectId) => {
    if (!portfolioStorage.containsKey(portfolioId)) {
      return Result.Err(`couldn't delete a portfolio with id=${portfolioId}. portfolio not found.`)
    }

    const portfolio: typeof Portfolio = portfolioStorage.get(portfolioId).Some;
    if (!portfolio.projects.find(item => item.projectId === projectId)) {
      return Result.Err(`couldn't delete an project at portfolio with id=${portfolioId}. project not found.`)
    }

    const Projects = portfolio.projects.filter((item: typeof Project) => item.projectId !== projectId)
    const updatedPortfolio: typeof Portfolio = { ...portfolio, projects: Projects, updatedAt: Some(ic.time()) };
    portfolioStorage.insert(portfolio.portfolioId, updatedPortfolio);

    return Result.Ok(updatedPortfolio);
  }),

})

// a workaround to make uuid package work with Azle
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  }
};
