import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const selector = searchParams.get("selector");

    // Validate the URL parameter
    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Only allow HTTP and HTTPS protocols for security
    if (!["http:", "https:"].includes(targetUrl.protocol)) {
      return NextResponse.json(
        { error: "Only HTTP and HTTPS URLs are allowed" },
        { status: 400 }
      );
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      // Set a timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch the webpage: ${response.status} ${response.statusText}`,
          status: response.status,
        },
        { status: response.status }
      );
    }

    // Get the HTML content
    const html = await response.text();

    // If selector is provided, extract specific content
    if (selector) {
      try {
        const $ = cheerio.load(html);
        const elements = $(selector);

        if (elements.length === 0) {
          return NextResponse.json({
            success: false,
            url: url,
            error: `No elements found with selector: ${selector}`,
            contentType: response.headers.get("content-type") || "text/html",
            status: response.status,
            timestamp: new Date().toISOString(),
          });
        }

        // Extract text content and HTML for each matching element
        const extractedContent = elements
          .map((index, element) => ({
            text: $(element).text().trim(),
            html: $.html(element),
            index: index,
          }))
          .get();

        return NextResponse.json({
          success: true,
          url: url,
          selector: selector,
          elementsFound: elements.length,
          extractedContent: extractedContent,
          contentType: response.headers.get("content-type") || "text/html",
          status: response.status,
          timestamp: new Date().toISOString(),
        });
      } catch (parseError) {
        return NextResponse.json({
          success: false,
          url: url,
          error: `Error parsing HTML with selector ${selector}: ${parseError}`,
          contentType: response.headers.get("content-type") || "text/html",
          status: response.status,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Return full HTML if no selector provided
    return NextResponse.json({
      success: true,
      url: url,
      html: html,
      contentType: response.headers.get("content-type") || "text/html",
      status: response.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error scraping webpage:", error);

    // Handle different types of errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: "Network error: Unable to reach the specified URL" },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout: The webpage took too long to respond" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while scraping the webpage" },
      { status: 500 }
    );
  }
}
