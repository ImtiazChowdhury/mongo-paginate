import dbConnection, { mongoDB } from "@imtiazchowdhury/mongopool";
import { Paginate } from "./types/types";
declare const paginate: Paginate;
export default paginate;
export { dbConnection, mongoDB };
