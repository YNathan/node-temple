const fs = require('fs');
const { zip } = require('zip-a-folder');

exports.createTemplate = async function (req, res) {

    if ((req.body.tblName == null) || (req.body.columns == null)) {
        res.status(404);
        res.send('you must fill table name and columns as an array');
        return;
    }

    // Importent Params
    const tblName = req.body.tblName;
    const tblAsObject = postgressNameToObjectName(tblName);
    const tblAsVariable = objectToVariableName(tblAsObject);

    const columns = req.body.columns;
    let thePk;
    let tblPkObj;
    let tblPkObjAsVrbl;

    const colsToTsTypes = [];

    // controller
    let columnsMConnSelectString = ``;
    let columnSelectString = ``;
    let columnsGetFromResultString = ``;

    // Parsers
    const parsersFromColText = '';

    for (const col of columns) {
        const colName = col.name;
        let colObj = '';

        if (col.isPk) {
            thePk = col;
            tblPkObj = tblAsObject + postgressNameToObjectName(colName);
            tblPkObjAsVrbl = tblAsVariable + postgressNameToObjectName(colName);
            colObj += tblPkObj;
        } else if (isConstraintValid(col.constraint)) {
            colObj = postgressNameToObjectName(col.constraint.tblParent) + postgressNameToObjectName(col.constraint.colParent);
        } else {
            colObj = fromNumberTypeToTypeScriptString(col.type);
        }
        // Controller request
        columnsMConnSelectString += `\n\t` + colName + `: Req<` + colObj + `>;`;
        columnSelectString += `\n\t\t\t"` + col.name + `",`;
        columnsGetFromResultString += `\n\t\t\t` + col.name + `: row.` + col.name + `.val(),`;

        colsToTsTypes.push({ name: colName, obj: colObj });
    }

    const colsDictionaryNameToType = columnToNameObjectValueDictionary(req);
    const importsFromObjectIds = whatDoWeNeedToImport(colsDictionaryNameToType);

    const base = './data/';
    if (!fs.existsSync(base)) {
        fs.mkdirSync(base);
    }

    const baseObject = base + tblName + '/';
    if (!fs.existsSync(baseObject)) {
        fs.mkdirSync(baseObject);
    }

    const path = baseObject + '/' + tblName + '_template/';
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }

    const modulsPath = path + '/' + tblName + '_module/';
    if (!fs.existsSync(modulsPath)) {
        fs.mkdirSync(modulsPath);
    }

    const constrollersPath = modulsPath + "/controllers/";
    if (!fs.existsSync(constrollersPath)) {
        fs.mkdirSync(constrollersPath);
    }

    const viewsPath = modulsPath + "/views/";
    if (!fs.existsSync(viewsPath)) {
        fs.mkdirSync(viewsPath);
    }

    const modelPath = modulsPath + "/model/";
    if (!fs.existsSync(modelPath)) {
        fs.mkdirSync(modelPath);
    }

    const options = { encoding: 'utf-8', flag: 'w' };
    // migration file
    const migrationText = generateMigrationTemplate(req);
    fs.writeFileSync(path + tblName + '_migration.sql', migrationText, options);
    // objectId file
    const objectIdTemplateText = generateObjectIdTemplate(tblAsObject);
    fs.writeFileSync(path + tblAsObject + 'ObjectsIds.ts', objectIdTemplateText, options);

    // message file
    const messagesTemplateText = generateMessageTemplate(req,tblAsObject,tblAsVariable);
    fs.writeFileSync(path + tblAsObject + '.ts', messagesTemplateText, options);

    // ctrl file
    const controllerTemplateText = generateControllerTemplate(req, tblAsObject,tblAsVariable, tblPkObj, tblPkObjAsVrbl, columnsMConnSelectString, columnsGetFromResultString,colsToTsTypes);
    fs.writeFileSync(constrollersPath + tblAsObject  + 'Ctrl.ts', controllerTemplateText, options);

    // params file
    const paramsTemplateText = generateReaderParamsTemplate(tblPkObj);
    fs.writeFileSync(viewsPath + tblName + '_params.ts', paramsTemplateText, options);

    // view file
    const viewTemplateText = generateViewTemplate(req,tblAsObject,tblAsVariable,tblPkObjAsVrbl);
    fs.writeFileSync(viewsPath + tblAsObject  + 'View.ts', viewTemplateText, options);

    // model file
    const modelTemplateText = generateModelTemplate(tblAsObject,colsToTsTypes);
    fs.writeFileSync(modelPath + tblAsObject  + '.ts', modelTemplateText, options);


    console.log('Write file data complete for table: ' + tblAsObject  + '.')

    await zip(path + '/../', base + tblName + '.zip');
    console.log('zip files complete for table: ' + tblAsObject  + '.');
    // zip archive of your folder is ready to download
    res.download(base + tblName + '.zip');

}

function getParsersFromCol(colsToTsTypes) {
    let parserFromColText = '';
    for (const col of colsToTsTypes) {
        parserFromColText += `\n\t\tpublic static p_${col.name}(val: any): db.ParseResult<${col.obj}>{
            return p_`+ col.obj + `(val);
        }`;
        parserFromColText += `\n\t\tpublic static f_${col.name}(val: ${col.obj}): db.Col {
            return f_${col.obj}(val);
        }`;
    }
    return parserFromColText;
}

function generateModelTemplate(tblAsObject,colsToTsTypes) {
    const columnsModelParsers = getParsersFromCol(colsToTsTypes);

    const text = `import * as db from "../../../db";
    import { f_`+ tblAsObject + `Id, p_AgencyId, p_` + tblAsObject + `Id } from "../../../db/ObjectIds";
    import { AgencyId } from "../../../messages";
    import { `+ tblAsObject + `Id } from "../../../messages/ObjectIds";

    export class `+ tblAsObject + ` {` + columnsModelParsers + `
    }
    `;

    return text;
}

function generateGetView(tblName,tblAsObject,tblAsVariable) {
    const text = `router.GET(
        "/agencies/:agencyId/`+ tblName + `s",
        \`
            Agency member request a list off `+ tblName + `s of the agency
        \`,
        "`+ tblAsObject + `s",
        async (context: AppContext, params: any, user: AuthData | null): Promise<messages.`+tblAsObject + `s> => {
            if (user === null || user.agencyMember === null) {
                throw new Router.StatusError(403);
            }
            const agencyId = await authenticateAgencyPermission(context, params, user);

            const `+tblAsVariable + `s = await context.readonlyConnProvider.withConnection((conn) => {
                return db.withTransaction(conn, () => {
                    return get`+tblAsObject + `sByAgencyId(conn, agencyId);
                });
            });
            return  {`+ tblAsVariable + `s: ` + tblAsVariable + `s};
        });;`
    return text;
}
function generatePutView(tblName, tblAsObject,tblAsVariable,tblPkObjAsVrbl) {
     const text = `router.PUT(
        "/agencies/:agencyId/`+ tblName + `/:` + tblPkObjAsVrbl + `",
        \`
        update `+ tblName + ` details
        \`,
        "`+ tblAsObject + `CreateParams",
        "`+ tblAsObject + `",
        async (context: AppContext, params: any, user: AuthData | null): Promise<messages.`+ tblAsObject + `> => {
            if (user === null || user.agencyMember === null) {
                throw new Router.StatusError(403);
            }
            const now = Instant.now();
            const `+ tblPkObjAsVrbl + ` = parseParam` + tblAsObject + `Id(params["` + tblPkObjAsVrbl + `"]);
            const `+ tblAsVariable + ` = await context.connPool.withConnection(conn => {
                return db.withTransaction(
                    conn,
                    async (): Promise<messages.`+ tblAsObject + `> => {
                        return await edit`+ tblAsObject + `(new MConnection(conn), now, ` + tblPkObjAsVrbl + `, params);
                    }
                );
            });
            return `+ tblAsVariable + `;
        }
    );`;
    return text;
}
function generatePostView(tblName, tblAsObject) {
    const text = `router.POST(
        "/billing_rate/:agencyId/`+ tblName + `",
        \`
    insert new `+ tblName + `
    \`,
        "`+ tblAsObject + `CreateParams",
        "`+ tblAsObject + `",
        async (context: AppContext, params: any, user: AuthData | null, req: messages.`+ tblAsObject + `CreateParams): Promise<messages.` + tblAsObject + `> => {
            if (user === null || user.agencyMember === null) {
                throw new Router.StatusError(403);
            }
            const agencyDetail = await authenticateAgencyCoordinatorPermission(context, params, user);
            const agencyMemberId = agencyDetail.agencyMemberId;

            const now = Instant.now();

            const resultInsert = await context.connPool.withConnection(conn => {
                return db.withTransaction(
                    conn,
                    async (): Promise<messages.`+ tblAsObject + `> => {
                        const returning`+ tblAsObject + `Id = await insert` + tblAsObject + `(new MConnection(conn), now, agencyMemberId, req);
                        return await get`+ tblAsObject + `ById(new MConnection(conn), returning` + tblAsObject + `Id);
                    }
                );
            });
            return resultInsert;
        }
    );`;
    return text;
}
function generateViewTemplate(req,tblAsObject,tblAsVariable,tblPkObjAsVrbl) {
    const tblName = req.body.tblName;
    const generetedGetRouter = generateGetView(tblName,tblAsObject,tblAsVariable);
    const generetedPutRouter = generatePutView(tblName,tblAsObject,tblAsVariable,tblPkObjAsVrbl);
    const generetedPostRouter = generatePostView(tblName, tblAsObject);
    const importText = `import { Instant } from "js-joda";
import { AppContext } from "../../../AppContext";
import { AuthData } from "../../../AuthManager";
import * as db from "../../../db";
import * as messages from "../../../messages";
import { MConnection } from "../../../medflyt_db";
import * as Router from "../../../Router";
import { authenticateAgencyPermission } from "../../../Utils/PermissionUtils";
import { get`+ tblAsObject + `ById, get` + tblAsObject + `sByAgencyId, edit` + tblAsObject + `, insert` + tblAsObject + ` } from "../controllers/` + tblAsObject + `Ctrl";
import { parseParam`+ tblAsObject + `Id } from "./` + tblName + `_params";\n
export function addRoutes(router: Router.Router<AppContext, AuthData, {}>) {
    \t`+ generetedGetRouter + `
    \n\t`+ generetedPutRouter + `
    \n\t`+ generetedPostRouter + `
}`
    const text = importText;
    return text;
}

function generateReaderParamsTemplate(tblPkObj) {
  const text = `import { ` + tblPkObj + ` } from "../../../messages/ObjectIds";
import { StatusError } from "../../../Router";

export function parseParam`+ tblPkObj + `(param: string): ` + tblPkObj + ` {
    const num = parseInt(param, 10);
    if (isNaN(num)) {
        throw new StatusError(404);
    }
    return `+ tblPkObj + `.wrap(num);
}`;
    return text;
}

function whatDoWeNeedToImport(columnsDictionary) {
    let objsToImport = '';
    for (const col of columnsDictionary) {
        if (col.obj !== "number" && col.obj !== "string" && col.obj !== "LocalDate" && col.obj !== "Instant" ) {
            objsToImport += col.obj + `, `
        }
    }
    // because of the spaces after the coma so twice
    objsToImport = removeLastCharacter(objsToImport);
    objsToImport = removeLastCharacter(objsToImport);
    return objsToImport;
}

function columnToNameObjectValueDictionary(req,tblAsObject) {
    const columnsDictionary = [];

    const columns = req.body.columns;

    for (const col of columns) {
        const colName = col.name;
        let colObj = '';

        if (col.isPk) {
            colObj += tblAsObject + `Id`;
        } else if (isConstraintValid(col.constraint)) {
            colObj = postgressNameToObjectName(col.constraint.tblParent) + postgressNameToObjectName(col.constraint.colParent);
        } else {
            colObj = fromNumberTypeToTypeScriptString(col.type);
        }
        columnsDictionary.push({ name: colName, obj: colObj });
    }

    return columnsDictionary;
}

function generateControllerTemplate(req, tblAsObject,tblAsVariable, tblPkObj, tblPkObjAsVrbl, columnsMConnSelectString, columnsGetFromResultString,colsToTsTypes) {

    const importsFromObjectIds = whatDoWeNeedToImport(colsToTsTypes);
    let relatedToAgency = false;

    const columns = req.body.columns;
    let thePk;
    let importTemplate = ` `;
    let colsTemplate = ``;
    for (const col of columns) {
        colsTemplate += `\n\t${col.name}: `;
        // handle primary key
        if (col.isPk) {
            thePk = { name: col.name, obj: tblAsObject + `Id` };
            colsTemplate += tblAsObject + `Id`;
        } else if (isConstraintValid(col.constraint)) {
            const relatedObjectId = postgressNameToObjectName(col.constraint.tblParent) + postgressNameToObjectName(col.constraint.colParent);
            colsTemplate += relatedObjectId;
            importTemplate += `,` + relatedObjectId;

            if (relatedObjectId === 'AgencyId') {
                relatedToAgency = true;
            }
        } else {
            colsTemplate += ` ` + fromNumberTypeToTypeScriptString(col.type);
            if (!col.isNotNull) {
                colsTemplate += ` | null`
            }
        }
        colsTemplate += `;`;
    }

    let controllerTemplateText = ``;
    const controllerImportSectionText = `import { Instant, LocalDate } from "js-joda";\nimport { MConnection } from "../../../medflyt_db";\nimport * as messages from "../../../messages";\nimport { ` + tblAsObject + `CreateParams } from "../../../messages/` + tblAsObject + `";\nimport { ` + importsFromObjectIds + ` } from "../../../messages/ObjectIds";\nimport { Req } from "../../../mfsqltool";`;
    controllerTemplateText += controllerImportSectionText;

    const controllerGetByOwnObjIdText = generateGetObjByIdTemplate(req.body.tblName, colsToTsTypes, thePk);
    controllerTemplateText += '\n' + controllerGetByOwnObjIdText;

    if (relatedToAgency) {
        const controllerGetListByAgencyIdText = generateGetListAgencyIdTemplate(req.body.tblName, colsToTsTypes,tblAsObject,tblAsVariable);
        controllerTemplateText += '\n' + controllerGetListByAgencyIdText;

    }

    const controllerUpdateObjText = generateEditObjTemplate(req.body.tblName, colsToTsTypes, thePk, tblAsObject, tblPkObj, tblPkObjAsVrbl, columnsMConnSelectString, columnsGetFromResultString, columnsGetFromResultString);
    controllerTemplateText += '\n' + controllerUpdateObjText;

    const controllerInsertObjText = generateInsertObjTemplate(req.body.tblName, colsToTsTypes, thePk);
    controllerTemplateText += '\n' + controllerInsertObjText;

    return controllerTemplateText;
}
function generateUpdateColsText(columnsDictionary, thePk) {
    let text = ``;

    for (const col of columnsDictionary) {
        if (col.name !== thePk.name) {
            text += `\n\t\t\t"` + col.name + `" = CASE WHEN \${params.` + col.name + ` !== undefined} THEN \${undefinedToNull(params.` + col.name + `)} ELSE "` + col.name + `" END,`;
        }
    }
    text = removeLastCharacter(text);
    return text;
}
function generateEditObjTemplate(tblName, colDictionay, thePk, tblAsObject, tblPkObject, tblPkObjAsVariable, columnsMConnSelectString, columnsGetFromResultString) {
    const generateColumnsParams = generateUpdateColsText(colDictionay, thePk);
    const text = `export async function edit` + tblAsObject + `(conn: MConnection, _now: Instant, ` + tblPkObjAsVariable + `: ` + tblPkObject + `, params: messages.` + tblAsObject + `EditParams): Promise<messages.` + tblAsObject + `> {
  const row = await conn.queryOne<{\t\t`+ columnsMConnSelectString + `
    }>(conn.sql\`
    UPDATE "`+ tblName + `"
        SET `+ generateColumnsParams + `
        WHERE "`+ thePk.name + `" = \${` + tblPkObjAsVariable + `}
        RETURNING *
        \`);
  return { \t`+ columnsGetFromResultString + `
  };
}

function undefinedToNull<T>(val: T | undefined): T | null {
    if (val === undefined) {
        return null;
    } else {
        return val;
    }
}
        `;
    return text;
}

function generateInsertObjTemplate(tblName, colDictionay, thePk) {
    let generateJsonParams = ``;
    for (const row of colDictionay) {
        generateJsonParams += `\n\t\t\t` + row.name + `: params.` + row.name + `, `
    }
    const text = `export async function insert` + postgressNameToObjectName(tblName) + `(conn: MConnection, now: Instant, agencyMemberId: AgencyMemberId, params: ` + postgressNameToObjectName(tblName) + `CreateParams): Promise < ` + postgressNameToObjectName(tblName) + `Id > {
    const row = await conn.insert < {
        `+ thePk.name + `: Req<` + thePk.obj + ` >;
    }> (
    "`+ tblName + `",
    {`+ generateJsonParams + `
      createdBy: agencyMemberId,
      createdAt: now
        },
    conn.sql\`
            RETURNING id;
            \`
        );

    const returned`+ thePk.obj + ` = row.` + thePk.name + `.val();
    return returned`+ thePk.obj + `;
}`;
    return text;
}

function generateGetListAgencyIdTemplate(tblName, colDictionay,tblAsObject,tblAsVariable) {
    let columnsNameToMConnectionObjsString = ``;
    let columnSelectString = ``;
    let colResultString = ``;
    for (col of colDictionay) {
        columnsNameToMConnectionObjsString += `\n\t  ` + col.name + `: Req<` + col.obj + `>;`;
        columnSelectString += `\n\t\t\t"` + col.name + `",`;
        colResultString += `\n\t\t\t` + col.name + `: row.` + col.name + `.val(),`;

    }
    columnSelectString = removeLastCharacter(columnSelectString);
    colResultString = removeLastCharacter(colResultString);

    const text = `export async function get` + tblAsObject + `sByAgencyId(conn: MConnection, agencyId: AgencyId): Promise<messages.` + postgressNameToObjectName(tblName) + `> {
  const `+ tblAsVariable + `s = await conn.queryOne<{` + columnsNameToMConnectionObjsString + `
  }>(conn.sql\`
        SELECT`+ columnSelectString + `
    FROM "`+ tblName + `"
    WHERE "agency" = \${agencyId}
    \`);
  const `+ tblAsVariable + `sArr: messages.` + tblAsObject + `[] = [];
  for (const row of `+ tblAsVariable + `s) {
    `+tblAsVariable + `sArr.push({` + colResultString + `\n\t\t});
  }
  return `+ tblAsVariable + `sArr;
}
`;
    return text;
}
function generateGetObjByIdTemplate(tblName, colDictionay, thePk) {
    let colsQuary = ``;
    let colsSelectString = ``;
    let colsResultString = ``;
    for (col of colDictionay) {
        colsQuary += `\n\t  ` + col.name + `: Req<` + col.obj + `>;`;
        colsSelectString += `\n\t\t\t"` + col.name + `",`;
        colsResultString += `\n\t  ` + col.name + `: result.` + col.name + `.val(),`;

    }
    colsSelectString = removeLastCharacter(colsSelectString);
    colsResultString = removeLastCharacter(colsResultString);
    const text = `export async function get` + postgressNameToObjectName(tblName) + `ById(conn: MConnection, ` + objectToVariableName(postgressNameToObjectName(tblName)) + `Id: ` + postgressNameToObjectName(tblName) + `Id): Promise<messages.` + postgressNameToObjectName(tblName) + `> {
  const result = await conn.queryOne<{`+ colsQuary + `
  }>(conn.sql\`
        SELECT`+ colsSelectString + `
    FROM "`+ tblName + `"
    WHERE "`+ thePk.name + `" = \${` + objectToVariableName(postgressNameToObjectName(tblName)) + `Id}
    \`);
  const `+ objectToVariableName(postgressNameToObjectName(tblName)) + `: messages.` + postgressNameToObjectName(tblName) + ` = {` + colsResultString + `
  };
  return `+ objectToVariableName(postgressNameToObjectName(tblName)) + `;
}`;
    return text;
}

function fromNumberTypeToTypeScriptString(number) {
    let typeEnum;

    switch (number) {
        case 0: {
            typeEnum = "number";
            break;
        }
        case 1: {
            typeEnum = "string";
            break;
        }
        case 2: {
            typeEnum = "boolean";
            break;
        }
        case 3: {
            typeEnum = "LocalDate";
            break;
        }
        case 4: {
            typeEnum = "Instant";
            break;
        }
        case 5: {
            typeEnum = "JSONB";
            break;
        }
        default: {
            typeEnum = "number";
            break;
        }
    }
    return typeEnum;
}
function fromNumberTypeToPostgressString(number) {
    let typeEnum;

    switch (number) {
        case 0: {
            typeEnum = "INTEGER";
            break;
        }
        case 1: {
            typeEnum = "TEXT";
            break;
        }
        case 2: {
            typeEnum = "BOOLEAN";
            break;
        }
        case 3: {
            typeEnum = "TIMESTAMP";
            break;
        }
        case 4: {
            typeEnum = "TIMESTAMPTZ";
            break;
        }
        case 5: {
            typeEnum = "JSONB";
            break;
        }
        default: {
            typeEnum = "INTEGER";
            break;
        }
    }
    return typeEnum;
}

function generateMigrationTemplate(req) {
    const tblName = req.body.tblName;
    const columns = req.body.columns;
    const constraints = [];
    let migrationTemplateText = `CREATE TABLE "${tblName}"\n(`;
    for (const col of columns) {
        const colName = col.name;
        migrationTemplateText += `\n\t"${colName}" `;
        // handle primary key
        if (col.isPk) {
            migrationTemplateText += ` SERIAL PRIMARY KEY`;
        }
        // handle not null
        else {
            migrationTemplateText += fromNumberTypeToPostgressString(col.type);

            if (col.isNotNull) {
                migrationTemplateText += ` NOT NULL`;
            }
        }
        migrationTemplateText += `,`;
        if (isConstraintValid(col.constraint)) {
            const tblParent = col.constraint.tblParent;
            const colParent = col.constraint.colParent;
            const constraintName = col.constraint.name;
            const colConstraintText = `ALTER TABLE "${tblName}" ADD CONSTRAINT ${constraintName} FOREIGN KEY ("${colName}") REFERENCES "${tblParent}" ("${colParent}");`;
            constraints.push(colConstraintText);
        }
    }
    // remove the coma of the last col
    migrationTemplateText = removeLastCharacter(migrationTemplateText);
    // closing the breakerts
    migrationTemplateText += '\n);';
    for (const currCnstrText of constraints) {
        migrationTemplateText += "\n";
        migrationTemplateText += currCnstrText;
    }
    return migrationTemplateText;
}

function generateObjectIdTemplate(tblAsObject) {
    const objectIdTemplateText = `/** @TJS-type number */
    export class ${tblAsObject}Id {
        private constructor() {}

        "${tblAsObject}Id": ${tblAsObject}Id;

        public static wrap(id: number): ${tblAsObject}Id {
            return <any>id;
        }

        public static unwrap(val: ${tblAsObject}Id): number {
            return <any>val;
        }
    }`;

    const pIdText = `export function p_${tblAsObject}Id(val: any): ParseResult<${tblAsObject}Id> {
        if (typeof val !== "number") {
            return ParseResult.Fail<${tblAsObject}Id>("not a number");
        }
        return ParseResult.Value(${tblAsObject}Id.wrap(val));
    }`;
}