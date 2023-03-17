import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { knex } from "../../knex/knex";
import MainApp from "../pages/_app";
import Simplepedia from "../pages/articles/[[...id]]";
import SimplepediaEditor from "../pages/articles/[id]/edit";
import SimplepediaCreator from "../pages/edit";
import articles from "../../data/test-data.json";

import mockRouter from "next-router-mock";
import { createDynamicRouteParser } from "next-router-mock/dynamic-routes";

// Replace the router with the mock
jest.mock("next/router", () => require("next-router-mock"));

// Tell the mock router about the pages we will use (so we can use dynamic routes)
mockRouter.useParser(
  createDynamicRouteParser([
    // These paths should match those found in the `/pages` folder:
    "/articles/[[...id]]",
    "/articles/[id]/edit",
    "/edit",
  ])
);

// We wrap the actual fetch implementation during testing so that we can introduce
// the absolute URL (needed on teh server but not on the browser)
const originalFetch = global.fetch;
global.fetch = (url, ...params) => {
  if (typeof url === "string" && url.startsWith("/")) {
    return originalFetch(`http://0.0.0.0:3000${url}`, ...params);
  }
  return originalFetch(url, ...params);
};

export const sampleSections = [
  ...new Set(articles.map((article) => article.title.charAt(0).toUpperCase())),
].sort();

const newArticle = {
  title: "321",
  contents: "contact",
};

describe("End to end testing", () => {
  beforeAll(() => {
    // Ensure test database is initialized before an tests
    return knex.migrate.rollback().then(() => knex.migrate.latest());
  });

  beforeEach(() => {
    mockRouter.setCurrentUrl("/articles");
    // Reset contents of the test database
    return knex.seed.run();
  });

  describe("Testing Simplepedia end-to-end behavior", () => {
    test("Correct sections are displayed", async () => {
      render(<MainApp Component={Simplepedia} />);
      const items = await screen.findAllByTestId("section");
      expect(items).toHaveLength(sampleSections.length);

      sampleSections.forEach((section) => {
        expect(screen.getByText(section)).toBeVisible();
      });
    });

    test("Selecting a section displays correct titles", async () => {
      render(<MainApp Component={Simplepedia} />);

      const section = sampleSections[2];
      const sampleArticles = articles.filter(
        (d) => d.title[0].toUpperCase() === section
      );
      const sectionComponent = await screen.findByText(section);
      fireEvent.click(sectionComponent);

      const titles = await screen.findAllByTestId("title");
      expect(titles).toHaveLength(sampleArticles.length);

      sampleArticles.forEach((article) => {
        expect(screen.getByText(article.title)).toBeVisible();
      });
    });

    test("Selecting a title requests the correct article", async () => {
      render(<MainApp Component={Simplepedia} />);

      const article = articles[2];
      const sectionComponent = await screen.findByText(
        article.title[0].toUpperCase()
      );
      fireEvent.click(sectionComponent);

      const titleComponent = await screen.findByText(article.title);
      fireEvent.click(titleComponent);
      expect(mockRouter.asPath).toBe(`/articles/${article.id}`);

      // Make sure any updates have resolved
      await waitFor(() => {
        expect(screen.queryAllByText(article.title)).toHaveLength(2);
        expect(screen.queryByText(article.contents)).toBeInTheDocument();
      });
    });

    test("Displayed article matches the route", async () => {
      const article = articles[2];
      mockRouter.setCurrentUrl(`/articles/${article.id}`);
      render(<MainApp Component={Simplepedia} />);

      // Make sure any updates have resolved
      await waitFor(() => {
        expect(screen.queryAllByText(article.title)).toHaveLength(2);
        expect(screen.queryByText(article.contents)).toBeInTheDocument();
      });
    });

    test("Only Add button is visible with no selection", async () => {
      render(<MainApp Component={Simplepedia} />);
      expect(screen.queryByRole("button", { name: "Add" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Edit" })
      ).not.toBeInTheDocument();

      // Make sure updates to sections have resolved
      await waitFor(() => {
        expect(screen.queryAllByTestId("section")).toHaveLength(
          sampleSections.length
        );
      });
    });

    test("Edit button visible when article selected", async () => {
      const article = articles[2];
      mockRouter.setCurrentUrl(`/articles/${article.id}`);
      render(<MainApp Component={Simplepedia} />);

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: "Add" })
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: "Edit" })
        ).toBeInTheDocument();

        // Make sure article and title updates have completed
        const titles = screen.getAllByText(article.title);
        expect(titles).toHaveLength(2);
        expect(screen.getByText(article.contents)).toBeInTheDocument();
      });
    });

    test("Add button opens editor", async () => {
      const { rerender, container } = render(
        <MainApp Component={Simplepedia} />
      );

      const add = screen.getByRole("button", { name: "Add" });
      fireEvent.click(add);
      expect(mockRouter.asPath).toBe("/edit");

      // Make sure all updates have completed
      rerender(<MainApp Component={SimplepediaCreator} />);
      await waitFor(() => {
        const titleEditor = container.querySelector("input[type=text]");
        const contentsEditor = container.querySelector("textarea");
        expect(titleEditor.value).toBe("");
        expect(contentsEditor.value).toBe("");
      });
    });

    test("Add button opens editor without currentArticle", async () => {
      const article = articles[2];
      mockRouter.setCurrentUrl(`/articles/${article.id}`);
      const { rerender, container } = render(
        <MainApp Component={Simplepedia} />
      );

      // Make sure any updates have resolved
      await waitFor(() => {
        expect(screen.queryAllByText(article.title)).toHaveLength(2);
        expect(screen.queryByText(article.contents)).toBeInTheDocument();
      });

      const add = screen.queryByRole("button", { name: "Add" });
      fireEvent.click(add);
      expect(mockRouter.asPath).toBe("/edit");

      rerender(<MainApp Component={SimplepediaCreator} />);
      await waitFor(() => {
        const titleEditor = container.querySelector("input[type=text]");
        const contentsEditor = container.querySelector("textarea");
        expect(titleEditor.value).toBe("");
        expect(contentsEditor.value).toBe("");
      });
    });

    test("Edit button opens editor with currentArticle", async () => {
      const article = articles[2];
      mockRouter.setCurrentUrl(`/articles/${article.id}`);
      render(<MainApp Component={Simplepedia} />);

      // Make sure any updates have resolved
      await waitFor(() => {
        expect(screen.queryAllByText(article.title)).toHaveLength(2);
        expect(screen.queryByText(article.contents)).toBeInTheDocument();
      });

      const add = await screen.findByRole("button", { name: "Edit" });
      fireEvent.click(add);
      expect(mockRouter.asPath).toBe(`/articles/${article.id}/edit`);
    });
  });

  describe("Testing Edit functionality", () => {
    test("/edit renders article creator with empty fields", async () => {
      mockRouter.setCurrentUrl(`/edit`);
      const { container } = render(<MainApp Component={SimplepediaCreator} />);

      await waitFor(() => {
        const titleEditor = container.querySelector("input[type=text]");
        const contentsEditor = container.querySelector("textarea");
        expect(titleEditor.value).toBe("");
        expect(contentsEditor.value).toBe("");
      });
    });

    test("/edit can create new article", async () => {
      mockRouter.setCurrentUrl(`/edit`);
      const { rerender, container } = render(
        <MainApp Component={SimplepediaCreator} />
      );

      const titleEditor = container.querySelector("input[type=text]");
      const contentsEditor = container.querySelector("textarea");

      fireEvent.change(titleEditor, {
        target: { value: newArticle.title },
      });
      fireEvent.change(contentsEditor, {
        target: { value: newArticle.contents },
      });

      const save = screen.queryByRole("button", { name: "Save" });
      fireEvent.click(save);

      await waitFor(async () => {
        const createdArticle = await knex("Article")
          .where({ title: newArticle.title })
          .first();
        expect(createdArticle).toBeDefined();
        expect(mockRouter.asPath).toBe(`/articles/${createdArticle.id}`);
      });

      rerender(<MainApp Component={Simplepedia} />);

      // Make sure any updates have resolved
      await waitFor(() => {
        expect(screen.queryAllByTestId("section")).toHaveLength(
          sampleSections.length + 1
        );
        expect(screen.queryAllByText(newArticle.title)).toHaveLength(2);
        expect(screen.queryByText(newArticle.contents)).toBeInTheDocument();
      });
    });

    test("/articles/id/edit enables editing specified article", async () => {
      const article = articles[2];
      mockRouter.setCurrentUrl(`/articles/${article.id}/edit`);
      const { container } = render(<MainApp Component={SimplepediaEditor} />);

      await waitFor(() => {
        const titleEditor = container.querySelector("input[type=text]");
        const contentsEditor = container.querySelector("textarea");
        expect(titleEditor.value).toBe(article.title);
        expect(contentsEditor.value).toBe(article.contents);
      });
    });

    test("/article/id/edit can edit existing article", async () => {
      const oldArticle = articles[2];
      mockRouter.setCurrentUrl(`/articles/${oldArticle.id}/edit`);
      const { rerender, container } = render(
        <MainApp Component={SimplepediaEditor} />
      );

      await waitFor(() => {
        const titleEditor = container.querySelector("input[type=text]");
        const contentsEditor = container.querySelector("textarea");
        expect(titleEditor.value).toBe(oldArticle.title);
        expect(contentsEditor.value).toBe(oldArticle.contents);
      });

      const titleEditor = container.querySelector("input[type=text]");
      const contentsEditor = container.querySelector("textarea");

      fireEvent.change(titleEditor, {
        target: { value: newArticle.title },
      });
      fireEvent.change(contentsEditor, {
        target: { value: newArticle.contents },
      });

      const save = screen.queryByRole("button", { name: "Save" });
      fireEvent.click(save);

      let updatedArticle;
      await waitFor(async () => {
        updatedArticle = await knex("Article")
          .where({ id: oldArticle.id })
          .first();
        expect(updatedArticle).toBeDefined();

        const { edited, ...expectedArticle } = {
          ...oldArticle,
          ...newArticle,
        };
        expect(updatedArticle).toMatchObject(expectedArticle);
        expect(
          new Date(updatedArticle.edited) > new Date(oldArticle.edited)
        ).toBe(true);
        expect(mockRouter.asPath).toBe(`/articles/${updatedArticle.id}`);
      });

      rerender(<MainApp Component={Simplepedia} />);

      // Make sure any updates have resolved
      await waitFor(() => {
        expect(screen.queryAllByText(newArticle.title)).toHaveLength(2);
        expect(screen.queryByText(newArticle.contents)).toBeInTheDocument();
      });
    });
  });
});
