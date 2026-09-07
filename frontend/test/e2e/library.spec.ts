"use strict";

import { test, expect } from "@playwright/test";

test.describe("Library Module - Critical Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to library page
    await page.goto("/library");
    // Wait for table to load
    await expect(page.locator("table")).toBeVisible();
  });

  test("Library loads with table view and 4 columns", async ({ page }) => {
    // Verify table renders with expected columns
    const headers = page.locator("th");
    await expect(headers).toHaveCount(4);
    await expect(headers.nth(0)).toContainText("Title");
    await expect(headers.nth(1)).toContainText("Authors");
    await expect(headers.nth(2)).toContainText("Publication Year");
    await expect(headers.nth(3)).toContainText("Processing Status");
  });

  test("Table sorting works via URL params", async ({ page }) => {
    // Click on Title header to sort ascending
    await page.click("th:has-text=Title");
    await expect(page.url()).toContain("sortField=title&sortDir=asc");

    // Click again for descending
    await page.click("th:has-text=Title");
    await expect(page.url()).toContain("sortField=title&sortDir=desc");
  });

  test("View toggle switches between table and card", async ({ page }) => {
    // Find view toggle buttons
    const tableViewButton = page.locator("button:has-text=Table");
    const cardViewButton = page.locator("button:has-text=Card");

    // Click card view
    await cardViewButton.click();
    await expect(page.locator(".card-view")).toBeVisible();
    await expect(page.locator("table")).toBeHidden();

    // Click table view
    await tableViewButton.click();
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator(".card-view")).toBeHidden();
  });

  test("Import button opens dialog with 2 tabs", async ({ page }) => {
    // Click import button
    await page.click("button:has-text=Import");

    // Verify dialog opens
    await expect(page.locator("[role=dialog]")).toBeVisible();

    // Verify tabs exist
    await expect(page.locator("button[value=web-upload]")).toBeVisible();
    await expect(page.locator("button[value=bulk-import]")).toBeVisible();

    // Verify active tab content
    await expect(page.locator("button[value=web-upload]")).toHaveAttribute("data-state", "active");
  });

  test("Web Upload tab allows file selection and upload", async ({ page }) => {
    // Open import dialog
    await page.click("button:has-text=Import");

    // Switch to web upload tab
    await page.click("button[value=web-upload]");

    // Select file
    const fileInput = page.locator("input[type=file]");
    await fileInput.setInputFiles("test.pdf");

    // Verify file selected
    await expect(fileInput).toHaveAttribute("data-file-selected", "true");

    // Upload (mock the API call)
    await page.click("button:has-text=Upload and Process");

    // Wait for upload to complete (mock response)
    await page.waitForTimeout(1000);

    // Verify success message
    await expect(page.locator(".bg-green-50")).toBeVisible();
  });

  test("Preferences persist across page refresh", async ({ page }) => {
    // Set preferences via localStorage
    await page.evaluate(() => {
      localStorage.setItem("tpl:library:prefs:v1", JSON.stringify({
        viewMode: "card",
        sortField: "authors",
        sortDir: "desc",
        splitPaneSizes: [25, 75],
        panelCollapsedStates: { "metadata-panel": true }
      }));
    });

    // Refresh page
    await page.reload();

    // Verify preferences restored
    await expect(page.locator("button[value=card]")).toHaveAttribute("data-state", "active");
    await expect(page.url()).toContain("sortField=authors&sortDir=desc");
  });

  test("Document navigation opens split-pane workspace", async ({ page }) => {
    // Click on a document row
    await page.click("tbody tr:first-child td:first-child a");

    // Verify split-pane opens
    await expect(page.locator(".split-pane")).toBeVisible();
    await expect(page.locator(".library-sidebar")).toBeVisible();

    // Verify PDF reader is present
    await expect(page.locator(".pdf-reader")).toBeVisible();
  });

  test("PDF reader supports 9 controls", async ({ page }) => {
    // Navigate to document first
    await page.click("tbody tr:first-child td:first-child a");

    // Verify all 9 controls exist
    const controls = [
      page.locator("button[aria-label=Page]"),
      page.locator("button[aria-label=Previous]"),
      page.locator("button[aria-label=Next]"),
      page.locator("button[aria-label=Zoom]"),
      page.locator("button:has-text=Fit Width"),
      page.locator("button:has-text=Fit Page"),
      page.locator("button[aria-label=Search]"),
      page.locator("button[aria-label=Rotate]"),
      page.locator("button[aria-label=Fullscreen]"),
    ];

    for (const control of controls) {
      await expect(control).toBeVisible();
    }
  });

  test("Metadata editing works with version control", async ({ page }) => {
    // Navigate to document
    await page.click("tbody tr:first-child td:first-child a");

    // Edit metadata field
    await page.fill("input[name=title]", "Updated Title");

    // Save changes
    await page.click("button:has-text=Save");

    // Verify version updated (mock)
    await expect(page.locator(".version-info")).toContainText("Version 2");
  });

  test("Artifacts panel shows preferred and additional artifacts", async ({ page }) => {
    // Navigate to document
    await page.click("tbody tr:first-child td:first-child a");

    // Verify artifacts panel exists
    await expect(page.locator(".artifacts-panel")).toBeVisible();

    // Verify preferred artifact badge
    await expect(page.locator(".preferred-badge")).toBeVisible();

    // Verify additional artifacts list
    await expect(page.locator(".additional-artifacts")).toBeVisible();
  });

  test("Multi-select works across pagination", async ({ page }) => {
    // Select first row
    await page.check("tbody tr:first-child input[type=checkbox]");

    // Navigate to next page
    await page.click("button:has-text=Next");

    // Select second row on next page
    await page.check("tbody tr:first-child input[type=checkbox]");

    // Verify selection toolbar shows count
    await expect(page.locator(".selection-toolbar")).toContainText("2 selected");
  });
});