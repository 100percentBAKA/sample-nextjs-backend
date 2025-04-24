import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest) {
  try {
    // Define the path to your existing Excel file
    const fileName = "Product.xlsx"; // Updated to match the actual file name
    const publicDir = path.join(process.cwd(), "public", "excel");
    const filePath = path.join(publicDir, fileName);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Excel file not found" },
        { status: 404 }
      );
    }

    // Read the file as a buffer for the response
    const fileBuffer = fs.readFileSync(filePath);

    // Set headers for file download
    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename=${fileName}`);
    headers.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Return the file as the response
    return new NextResponse(fileBuffer, {
      headers,
    });
  } catch (error) {
    console.error("Error serving Excel file:", error);
    return NextResponse.json(
      { error: "Failed to serve Excel file" },
      { status: 500 }
    );
  }
}
