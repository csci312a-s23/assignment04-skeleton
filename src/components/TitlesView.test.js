import TitlesView from "./TitlesView";

import { screen, fireEvent, render } from "@testing-library/react";

import articles from "../../data/test-data.json";

describe("TitlesView tests", () => {
  test("TitlesView displays all titles", async () => {
    render(
      <TitlesView articles={[...articles]} setCurrentArticle={jest.fn()} />
    );
    articles.forEach((article) => {
      expect(screen.getByText(article.title)).toBeVisible();
    });
  });

  test("TitlesView displays only the requested articles", async () => {
    render(
      <TitlesView articles={[...articles]} setCurrentArticle={jest.fn()} />
    );
    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(articles.length);
  });

  test("Clicking on a title selects the article", async () => {
    const handler = jest.fn();
    render(<TitlesView articles={[...articles]} setCurrentArticle={handler} />);

    for (let i = 0; i < articles.length; i++) {
      const section = await screen.findByText(articles[i].title);
      fireEvent.click(section);
      expect(handler).toHaveBeenCalledWith(articles[i]);
    }
  });

  test("Titles are displayed in alphabetical order", async () => {
    render(
      <TitlesView articles={[...articles]} setCurrentArticle={jest.fn()} />
    );

    const sortedTitles = articles.map((article) => article.title);
    sortedTitles.sort((t1, t2) => t1.localeCompare(t2));

    const items = await screen.findAllByRole("listitem");
    const displayedTitles = items.map((item) => item.innerHTML);

    expect(displayedTitles).toEqual(sortedTitles);
  });

  test("Props are not mutated", () => {
    const inputArticles = [...articles];
    render(
      <TitlesView articles={inputArticles} setCurrentArticle={jest.fn()} />
    );

    expect(inputArticles).toEqual(articles);
  });
});
