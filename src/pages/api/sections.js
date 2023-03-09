import { knex } from "../../../knex/knex";

export default async function handler(req, res) {
  const { method } = req;
  switch (method) {
    case "GET":
      const sections = await knex("Article")
        .select(knex.raw("UPPER(SUBSTRING(title, 1, 1)) AS section"))
        .distinct()
        .orderBy("section");
      res.status(200).json(sections.map(Object.values).flat());
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
