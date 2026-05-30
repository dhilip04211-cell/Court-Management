/**
 * Vercel Serverless Function for complex Google Sheets operations
 * Handles batch updates, metadata queries, and sheet manipulation
 */

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { token, spreadsheetId, operation, ...payload } = req.body;

  if (!token || !spreadsheetId) {
    return res.status(400).json({ error: "Missing token or spreadsheetId" });
  }

  try {
    switch (operation) {
      case "getMeta":
        return await getMeta(res, token, spreadsheetId);

      case "batchUpdate":
        return await batchUpdate(res, token, spreadsheetId, payload);

      case "getSheetIdByName":
        return await getSheetIdByName(res, token, spreadsheetId, payload.tabName);

      case "deleteRow":
        return await deleteRow(res, token, spreadsheetId, payload);

      case "insertRow":
        return await insertRow(res, token, spreadsheetId, payload);

      default:
        return res.status(400).json({ error: "Unknown operation" });
    }
  } catch (error) {
    console.error("Sheets operation error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function getMeta(res, token, spreadsheetId) {
  const url = `${SHEETS_API_BASE}/${spreadsheetId}?fields=sheets.properties`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json(data);
  }

  res.status(200).json(data);
}

async function getSheetIdByName(res, token, spreadsheetId, tabName) {
  const url = `${SHEETS_API_BASE}/${spreadsheetId}?fields=sheets.properties`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = await response.json();

  if (!response.ok) {
    return res.status(response.status).json(meta);
  }

  const sheet = (meta.sheets || []).find((s) => s.properties.title === tabName);
  const sheetId = sheet ? sheet.properties.sheetId : null;

  res.status(200).json({ sheetId });
}

async function batchUpdate(res, token, spreadsheetId, payload) {
  const { requests } = payload;
  const url = `${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json(data);
  }

  res.status(200).json(data);
}

async function deleteRow(res, token, spreadsheetId, payload) {
  const { tabName, oneBasedRow, sheetId } = payload;

  if (sheetId === null) {
    return res.status(400).json({ error: "Invalid sheet ID" });
  }

  const url = `${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: oneBasedRow - 1,
              endIndex: oneBasedRow,
            },
          },
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json(data);
  }

  res.status(200).json({ ok: response.ok });
}

async function insertRow(res, token, spreadsheetId, payload) {
  const { tabName, oneBasedRow, sheetId } = payload;

  if (sheetId === null) {
    return res.status(400).json({ error: "Invalid sheet ID" });
  }

  const url = `${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: oneBasedRow - 1,
              endIndex: oneBasedRow,
            },
            inheritFromBefore: false,
          },
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json(data);
  }

  res.status(200).json({ ok: response.ok });
}
