/**
 * Vercel Serverless Function to proxy Google Sheets API requests
 * This prevents CORS issues and keeps authentication secure on the server
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

  const { token, spreadsheetId, range, method = "GET", values } = req.body;

  if (!token || !spreadsheetId) {
    return res.status(400).json({ error: "Missing token or spreadsheetId" });
  }

  try {
    const encodedRange = encodeURIComponent(range);
    let url;
    let fetchOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (method === "GET") {
      url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodedRange}`;
      fetchOptions.method = "GET";
    } else if (method === "PUT") {
      url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;
      fetchOptions.method = "PUT";
      fetchOptions.body = JSON.stringify({ values });
    } else if (method === "APPEND") {
      url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`;
      fetchOptions.method = "POST";
      fetchOptions.body = JSON.stringify({ values });
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Sheets API error:", error);
    res.status(500).json({ error: error.message });
  }
}
