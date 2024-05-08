"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongodb = exports.dbConnection = void 0;
const mongopool_1 = __importDefault(require("@imtiazchowdhury/mongopool"));
exports.dbConnection = mongopool_1.default;
const mongodb = __importStar(require("mongodb"));
exports.mongodb = mongodb;
const paginate = function (collection, prePagingStage, postPagingStage, options, facet, aggregateOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        let { sort: sortOption, page: pageOption, limit: limitOption, sortOrder = -1, fetchAll } = options;
        //defaults
        let sort;
        if (sortOption && typeof sortOption == "string") {
            sort = sortOption;
        }
        else {
            sort = 'createdDate'; //default sort by serial;
        }
        let limit = (limitOption && isFinite(limitOption) && limitOption > 0) ? limitOption : 50; //default limit is 50
        let page = pageOption && isFinite(pageOption) ? pageOption : 1; //default first page
        const aggregatePipeLine = [];
        aggregatePipeLine.push(...prePagingStage);
        const sortStage = [
            { $sort: { [sort]: sortOrder, _id: 1 } }
        ];
        const pagingStage = [];
        if (fetchAll != 1) {
            pagingStage.push(...[
                { $skip: limit * (page - 1) },
                { $limit: limit }
            ]);
        }
        postPagingStage.unshift(...sortStage, ...pagingStage);
        //check for any $group stage in agPipe pipeline
        // sort before $group does not work, has to be inserted after $group
        let groupIndex = 0;
        // get the last index of $group
        postPagingStage.forEach((item, index) => {
            if ("$group" in item || "$replaceRoot" in item)
                groupIndex = index;
        });
        postPagingStage.splice(groupIndex + 1, 0, ...sortStage);
        const facetStage = {
            page: [
                {
                    $count: "totalIndex"
                },
            ],
            data: postPagingStage,
        };
        if (facet && facet.length) {
            for (let stage of facet) {
                if (stage && stage.key && stage.query)
                    facetStage[stage.key] = stage.query;
            }
        }
        aggregatePipeLine.push({ $facet: facetStage });
        let aggregateResult;
        if (typeof collection === "string") {
            let db = yield mongopool_1.default.getDB();
            aggregateResult = yield db.collection(collection).aggregate(aggregatePipeLine, aggregateOptions).toArray();
        }
        else if (typeof collection.collectionName === "string" && typeof collection.aggregate === "function") { //mongodb
            aggregateResult = yield collection.aggregate(aggregatePipeLine, aggregateOptions).toArray();
        }
        else if (typeof collection.aggregate === "function") { //mongoose
            aggregateResult = yield collection.aggregate(aggregatePipeLine, aggregateOptions).exec();
        }
        else {
            throw new Error("Invalid collection type provided");
        }
        let result = aggregateResult[0];
        if (!result || !result["page"] || !result["page"][0])
            return { page: {}, data: [] };
        if (fetchAll == 1)
            limit = result["data"].length;
        const totalIndex = result["page"][0].totalIndex;
        const totalPage = Math.ceil(totalIndex / limit);
        const startingIndex = limit * (page - 1) + 1;
        const pageInfo = {
            totalIndex,
            totalPage,
            currentPage: page,
            nextPage: totalPage > page ? page + 1 : null,
            previousPage: page > 1 ? page - 1 : null,
            startingIndex,
            endingIndex: startingIndex + result["data"].length - 1,
            itemsOnCurrentPage: result["data"].length,
            limit: limit,
            sort: sort,
            sortOrder: sortOrder
        };
        delete result["page"];
        return Object.assign({ page: pageInfo, data: result["data"] }, result);
    });
};
exports.default = paginate;
