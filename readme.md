# Mongodb Paginate

## installation

```sh
npm install mongodb-paginate
```

## Why & How

mongodb-paginate allows you to **efficiently write mongodb aggregation queries and gets pagination data from mongodb in the same query**.

It maximizes query efficiency by properly optimizing filter and lookup operations and then getting the document count using the mongodb ```$facet``` operator.

Every aggregation gets divided in 3 major stages

1. **Pre-paging**: All filtering of documents should be called in this stage. This stage is called first to ensure reducing pipeline size as early as possible
2. **Facet**: data is divided into two buckets in here. One only keeps count of matching documents for pagination info purposes and the other one is used for
the post-paging stage. Custom facet buckets can also inserted here if required.
3. **Post-paging**: All lookup and other expensive operations should be done in here as this is called at the last making sure that lookups and other operations
only happens to the minimum number of documents possible.

## Usage

```js

import paginate, { dbConnection } from "mongodb-paginate";

dbConnection.url = "mongodb://127.0.0.1:27017" // YOUR DATABASE URL
dbConnection.dbName = "DB_NAME" //YOUR DATABASE NAME

...

const prePagingStage = [], postPagingStage = [], facet = [];

//filter
prePagingStage.push(...[
    {
        $match: {
            featured: true
        }
    }
])

//populate
postPagingStage.push({
    $lookup: {
        from: "category",
        localField: "category",
        foreignField: "_id",
        as: "category"
    }
})

//custom facet queries if needed
facet.push({
    key: "categoryWiseCount",
    query: [
        { $unwind: "$category" },
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 },
            }
        }
    ]
})

const pagingOptions = { page: 2, limit: 1 };

const result = await paginate(
    "product", 
    prePagingStage, 
    postPagingStage, 
    pagingOptions
    facet
);

...

```

the above query will generate a response similar to the following:

```json
{
    // pagination data from the facet stage after filtering
    "page": {
        "totalIndex": 56,
        "totalPage": 56,
        "currentPage": 2,
        "nextPage": 3,
        "previousPage": 1,
        "startingIndex": 2,
        "endingIndex": 2,
        "itemsOnCurrentPage": 1,
        "limit": 1,
        "sort": "createdDate",
        "sortOrder": -1
    },

    //mongodb pipeline output
    "data": [
        {
            "_id": "64ef2b99e399e2df52fc7c2c",
            "title": "Motorized treadmill 2.0hp with free massager - Walking Stick - gym equipment",
            "category": [
                {
                    "_id": "64eee55cbe86262266b88871",
                    "title": "Treadmills",
                    "createdDate": "2023-08-30T06:44:44.494Z",
                    "lastUpdatedDate": "2023-10-14T08:14:28.861Z",
                }
            ],
            "price": {
                "regular": 42000,
                "offer": 34500
            },
            "createdDate": "2023-08-30T11:44:25.069Z",
            "lastUpdatedDate": "2023-10-14T08:17:44.678Z"
        },
        
        ...

    ],

    //custom facet result
    "categoryWiseCount": [
        
        {
            "_id": "64eb0f8add901762fcce416a",
            "count": 8
        },
        {
            "_id": "64eee55cbe86262266b88871",
            "count": 5
        },
        
        ...
        
    ]
}

```

## Types

```ts
function Paginate(
    collection: string, 
    prePagingState: mongoDB.Document[], 
    postPagingStage: mongoDB.Document[], 
    options: PaginationOptions, 
    facet: FacetBucketQuery[]
) => Promise<mongoDB.Document>
```
```ts
PaginationOptions {
    sort?: string;
    page?: number;
    limit?: number;
    sortOrder?: 1 | -1;
    fetchAll?: 1 | 0;
}

PaginateResult {
    page: {
        totalPage: number;
        currentPage: number;
        nextPage: number;
        previousPage: number;
        startingIndex: number;
        endingIndex: number;
        itemsOnCurrentPage: number;
        limit: number;
        sort: string;
        sortOrder: number;
    };
    data: mongoDB.Document[];
}

FacetBucketQuery {
    key: string;
    query: mongoDB.Document[];
}
```
