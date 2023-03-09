import { knex } from "../../../../knex/knex";

export default async function handler(req, res) {
  const { method, query } = req;
  switch (method) {
    case "GET": {
      let knexQuery = knex("Article");
      if (query.section) {
        knexQuery = knexQuery.whereRaw("UPPER(SUBSTRING(title, 1, 1)) = ?", [
          query.section,
        ]);
      }
      const articles = await knexQuery;
      res.status(200).json(articles);
      break;
    }
    case "POST": {
      const { id, ...article } = req.body;
      const [insertedId] = await knex("Article").insert(article);
      res.status(200).json({ ...article, id: insertedId });
      break;
    }
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
