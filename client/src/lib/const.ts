interface AppState {
    processing: boolean;
    copied: boolean;
    dbTables: {
        availableTables: string[];
        availableFields: Record<string, string[]>;
    };
    form: {
        table: string;
        query: string;
        condition: string;
    };
    result: Record<string, any> | null;
    error: string | null;
}

const Queries = [
    "create",
    "createMany",
    "update",
    "updateMany",
    "upsert",
    "delete",
    "deleteMany",
    "findUnique",
    "findFirst",
    "findMany",
    "groupBy",
    "count",
    "aggregate",
    "findRaw",
    "aggregateRaw",
];

const whereAlone = JSON.stringify({ where: {} }, null, 2);

const mandatoryParams = {
    create: JSON.stringify({ data: {} }, null, 2),
    createMany: JSON.stringify({ data: [] }, null, 2),
    update: whereAlone,
    updateMany: whereAlone,
    upsert: JSON.stringify({ create: {}, update: {} }, null, 2),
    delete: whereAlone,
    deleteMany: whereAlone,
    findUnique: whereAlone,
    groupBy: JSON.stringify({ by: [] }, null, 2),
} as Record<string, string>;

const initialAppState: AppState = {
    processing: false,
    copied: false,
    dbTables: {
        availableTables: [],
        availableFields: {},
    },
    form: {
        table: "",
        query: "",
        condition: "",
    },
    result: null,
    error: null,
};

export { Queries, mandatoryParams, initialAppState };