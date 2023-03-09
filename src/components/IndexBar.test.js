import IndexBar from "./IndexBar";
import { knex } from "../../knex/knex";
import { screen, render, fireEvent, waitFor } from "@testing-library/react";
import articles from "../../data/test-data.json";

export const sampleSections = [
  ...new Set(articles.map((article) => article.title.charAt(0).toUpperCase())),
].sort();

// We wrap the actual fetch implementation during testing so that we can introduce
// the absolute URL (needed on teh server but not on the browser)
const originalFetch = global.fetch;
global.fetch = (url, ...params) => {
  if (typeof url === "string" && url.startsWith("/")) {
    return originalFetch(`http://0.0.0.0:3000${url}`, ...params);
  }
  return originalFetch(url, ...params);
};

describe("IndexBar tests", () => {
  beforeEach(() => {
    // Reset the test database before every test
    return knex.migrate
      .rollback()
      .then(() => knex.migrate.latest())
      .then(() => knex.seed.run());
  });

  describe("IndexBar: Basic IndexBar functionality", () => {
    let selectFunction;
    beforeEach(() => {
      selectFunction = jest.fn();
      render(<IndexBar setCurrentArticle={selectFunction} />);
    });

    test("IndexBar: Fetches and displays sections", async () => {
      const items = await screen.findAllByTestId("section");

      expect(items).toHaveLength(sampleSections.length);
      sampleSections.forEach((section) => {
        expect(screen.getByText(section)).toBeVisible();
      });
    });

    test("IndexBar: Clicking on a section displays titles", async () => {
      const section = await screen.findByText(sampleSections[0]);

      fireEvent.click(section);

      const titles = await screen.findAllByTestId("title");
      const expectedArticles = articles.filter(
        (article) => article.title.charAt(0).toUpperCase() === sampleSections[0]
      );
      expect(titles).toHaveLength(expectedArticles.length);
      expectedArticles.forEach((article) => {
        expect(screen.getByText(article.title)).toBeVisible();
      });
    });

    test("IndexBar: Changing sections changes the titles", async () => {
      let section = await screen.findByText(sampleSections[0]);
      fireEvent.click(section);

      await screen.findAllByTestId("title");

      section = await screen.findByText(sampleSections[1]);

      fireEvent.click(section);

      const expectedArticles = articles.filter(
        (article) => article.title.charAt(0).toUpperCase() === sampleSections[1]
      );

      // Since we load new titles asynchronously, the titles may be present but not yet updated
      // for a period of time. Thus, we can't just wait to find those elements, but must wait until
      // the matchers are successful (or there is a timeout)
      await waitFor(() => {
        const titles = screen.queryAllByTestId("title");
        expect(titles).toHaveLength(expectedArticles.length);
        expectedArticles.forEach((article) => {
          expect(screen.getByText(article.title)).toBeInTheDocument();
        });
      });
    });

    test("IndexBar: Clicking a title selects the article", async () => {
      const section = await screen.findByText("D");

      fireEvent.click(section);

      const title = await screen.findByText("Dalek");

      fireEvent.click(title);

      expect(selectFunction).toHaveBeenCalledWith(articles[4]);
    });
  });

  describe("IndexBar: IndexBar with currentArticle", () => {
    let selectFunction;

    beforeEach(() => {
      selectFunction = jest.fn();
    });

    test("IndexBar: currentArticle sets the current section", async () => {
      render(
        <IndexBar
          setCurrentArticle={selectFunction}
          currentArticle={articles[1]}
        />
      );
      const title = await screen.findByText(articles[1].title);
      expect(title).toBeInTheDocument();
    });

    test("IndexBar: Changing currentArticle updates section", async () => {
      const { rerender } = render(
        <IndexBar
          setCurrentArticle={selectFunction}
          currentArticle={articles[1]}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText(articles[1].title)).toBeInTheDocument();
        expect(screen.queryByText(articles[0].title)).not.toBeInTheDocument();
      });

      rerender(
        <IndexBar
          setCurrentArticle={selectFunction}
          currentArticle={articles[0]}
        />
      );
      await waitFor(() => {
        expect(screen.queryByText(articles[1].title)).not.toBeInTheDocument();
        expect(screen.queryByText(articles[0].title)).toBeInTheDocument();
      });
    });

    test("IndexBar: currentarticle with new section reloads sections", async () => {
      const { rerender } = render(
        <IndexBar setCurrentArticle={selectFunction} />
      );
      await screen.findAllByTestId("section");
      expect(screen.queryByText("Z")).not.toBeInTheDocument();

      const newArticle = {
        title: "Zebra",
        contents: "Striped mammal",
        edited: new Date().toISOString(),
      };
      const [id] = await knex("Article").insert(newArticle);

      rerender(
        <IndexBar
          setCurrentArticle={selectFunction}
          currentArticle={{ ...newArticle, id }}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText("Z")).toBeInTheDocument();
      });
    });
  });
});
