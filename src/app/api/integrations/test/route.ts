import { NextRequest, NextResponse } from "next/server";

// Test each integration by making a real API call with provided credentials
export async function POST(req: NextRequest) {
  const { id, config } = await req.json();

  try {
    switch (id) {
      case "slack": {
        // Validate Slack webhook by posting a test message
        const res = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "✅ DOC-EYE connected successfully." }),
        });
        if (!res.ok) throw new Error(`Slack returned ${res.status}`);
        return NextResponse.json({ ok: true, message: "Slack webhook verified." });
      }

      case "jira": {
        // Validate Jira credentials by fetching the project
        const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");
        const res = await fetch(
          `${config.baseUrl}/rest/api/3/project/${config.projectKey}`,
          { headers: { Authorization: `Basic ${auth}`, Accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`Jira returned ${res.status} — check base URL, email, token, or project key`);
        const data = await res.json();
        return NextResponse.json({ ok: true, message: `Jira project "${data.name}" found.` });
      }

      case "sharepoint": {
        // Validate SharePoint/Microsoft Graph token by fetching site info
        const res = await fetch(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}`,
          { headers: { Authorization: `Bearer ${config.accessToken}`, Accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`SharePoint returned ${res.status} — check Site ID and access token`);
        const data = await res.json();
        return NextResponse.json({ ok: true, message: `SharePoint site "${data.displayName}" found.` });
      }

      case "teams": {
        // Validate Teams webhook
        const res = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            text: "✅ DOC-EYE connected successfully.",
          }),
        });
        if (!res.ok) throw new Error(`Teams returned ${res.status}`);
        return NextResponse.json({ ok: true, message: "Teams webhook verified." });
      }

      case "salesforce": {
        // Validate Salesforce with OAuth token by querying instance URL
        const res = await fetch(
          `${config.instanceUrl}/services/data/v58.0/`,
          { headers: { Authorization: `Bearer ${config.accessToken}`, Accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`Salesforce returned ${res.status} — check Instance URL and access token`);
        return NextResponse.json({ ok: true, message: "Salesforce connection verified." });
      }

      case "confluence": {
        // Validate Confluence by fetching space info
        const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");
        const res = await fetch(
          `${config.baseUrl}/wiki/rest/api/space/${config.spaceKey}`,
          { headers: { Authorization: `Basic ${auth}`, Accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`Confluence returned ${res.status} — check base URL, email, token, or space key`);
        const data = await res.json();
        return NextResponse.json({ ok: true, message: `Confluence space "${data.name}" found.` });
      }

      default:
        return NextResponse.json({ ok: false, message: "Unknown integration." }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
