import "server-only";

import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

export interface LocalPackingLabelItem {
  quantity: number;
  productName: string;
  variantLabel: string | null;
  variantSku: string | null;
}

export interface LocalPackingLabelInput {
  orderId: string;

  customerName: string;
  phone: string;

  address: string;
  city: string;
  state: string;
  pincode: string;

  totalAmount: number;
  createdAt: Date;

  items: LocalPackingLabelItem[];
}

const POINTS_PER_MM =
  72 / 25.4;

const PAGE_WIDTH =
  100 * POINTS_PER_MM;

const PAGE_HEIGHT =
  150 * POINTS_PER_MM;

const MARGIN = 12;

const CONTENT_WIDTH =
  PAGE_WIDTH -
  MARGIN * 2;

const BLACK =
  rgb(0, 0, 0);

function safeText(
  value: string,
) {
  /*
   * Standard PDF fonts use WinAnsi encoding.
   * Keep this first printer version predictable
   * by converting unsupported characters instead
   * of allowing PDF generation to fail.
   */
  return value
    .normalize("NFKD")
    .replace(
      /[^\x20-\x7E]/g,
      "?",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function wrapLongWord(
  word: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
) {
  const lines: string[] = [];

  let current = "";

  for (const character of word) {
    const candidate =
      current + character;

    if (
      current &&
      font.widthOfTextAtSize(
        candidate,
        fontSize,
      ) > maxWidth
    ) {
      lines.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function wrapText(
  value: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
) {
  const text =
    safeText(value);

  if (!text) {
    return [];
  }

  const words =
    text.split(" ");

  const lines: string[] = [];

  let current = "";

  for (const word of words) {
    if (
      font.widthOfTextAtSize(
        word,
        fontSize,
      ) > maxWidth
    ) {
      if (current) {
        lines.push(current);
        current = "";
      }

      lines.push(
        ...wrapLongWord(
          word,
          font,
          fontSize,
          maxWidth,
        ),
      );

      continue;
    }

    const candidate =
      current
        ? `${current} ${word}`
        : word;

    if (
      current &&
      font.widthOfTextAtSize(
        candidate,
        fontSize,
      ) > maxWidth
    ) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function drawLines(
  page: PDFPage,
  lines: string[],
  options: {
    x: number;
    y: number;
    font: PDFFont;
    fontSize: number;
    lineHeight: number;
  },
) {
  let y =
    options.y;

  for (const line of lines) {
    page.drawText(
      line,
      {
        x:
          options.x,
        y:
          y -
          options.fontSize,

        size:
          options.fontSize,

        font:
          options.font,

        color:
          BLACK,
      },
    );

    y -=
      options.lineHeight;
  }

  return y;
}

function drawWrappedText(
  page: PDFPage,
  value: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    font: PDFFont;
    fontSize: number;
    lineHeight: number;
  },
) {
  return drawLines(
    page,
    wrapText(
      value,
      options.font,
      options.fontSize,
      options.maxWidth,
    ),
    options,
  );
}

function drawDivider(
  page: PDFPage,
  y: number,
) {
  page.drawLine({
    start: {
      x: MARGIN,
      y,
    },
    end: {
      x:
        PAGE_WIDTH -
        MARGIN,
      y,
    },
    thickness:
      0.8,
    color:
      BLACK,
  });

  return y - 7;
}

function formatOrderDate(
  value: Date,
) {
  /*
   * Vercel runs server code independently of the
   * store's local timezone. Format order dates
   * explicitly in India Standard Time so labels
   * do not show the previous date around midnight.
   */
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone:
        "Asia/Kolkata",

      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",
    },
  )
    .format(value)
    .replace(
      /\//g,
      "-",
    );
}

export async function createLocalPackingLabel(
  input: LocalPackingLabelInput,
) {
  const pdfDocument =
    await PDFDocument.create();

  const regularFont =
    await pdfDocument.embedFont(
      StandardFonts.Helvetica,
    );

  const boldFont =
    await pdfDocument.embedFont(
      StandardFonts.HelveticaBold,
    );

  const page =
    pdfDocument.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

  let y =
    PAGE_HEIGHT -
    MARGIN;

  const title =
    "OM SHREE FOODS & CATERERS";

  const titleSize =
    13;

  const titleWidth =
    boldFont.widthOfTextAtSize(
      title,
      titleSize,
    );

  page.drawText(
    title,
    {
      x:
        Math.max(
          MARGIN,
          (PAGE_WIDTH -
            titleWidth) /
            2,
        ),

      y:
        y -
        titleSize,

      size:
        titleSize,

      font:
        boldFont,

      color:
        BLACK,
    },
  );

  y -= 22;

  const localTitle =
    "LOCAL DELIVERY";

  const localTitleSize =
    11;

  const localTitleWidth =
    boldFont.widthOfTextAtSize(
      localTitle,
      localTitleSize,
    );

  page.drawText(
    localTitle,
    {
      x:
        Math.max(
          MARGIN,
          (PAGE_WIDTH -
            localTitleWidth) /
            2,
        ),

      y:
        y -
        localTitleSize,

      size:
        localTitleSize,

      font:
        boldFont,

      color:
        BLACK,
    },
  );

  y -= 20;

  y =
    drawDivider(
      page,
      y,
    );

  y =
    drawWrappedText(
      page,
      `ORDER: ${input.orderId}`,
      {
        x:
          MARGIN,
        y,
        maxWidth:
          CONTENT_WIDTH,
        font:
          boldFont,
        fontSize:
          8,
        lineHeight:
          10,
      },
    );

  y -= 2;

  y =
    drawWrappedText(
      page,
      `DATE: ${formatOrderDate(input.createdAt)}`,
      {
        x:
          MARGIN,
        y,
        maxWidth:
          CONTENT_WIDTH,
        font:
          regularFont,
        fontSize:
          8,
        lineHeight:
          10,
      },
    );

  y -= 3;

  y =
    drawDivider(
      page,
      y,
    );

  y =
    drawWrappedText(
      page,
      "DELIVER TO",
      {
        x:
          MARGIN,
        y,
        maxWidth:
          CONTENT_WIDTH,
        font:
          boldFont,
        fontSize:
          9,
        lineHeight:
          11,
      },
    );

  y -= 2;

  y =
    drawWrappedText(
      page,
      input.customerName,
      {
        x:
          MARGIN,
        y,
        maxWidth:
          CONTENT_WIDTH,
        font:
          boldFont,
        fontSize:
          10,
        lineHeight:
          12,
      },
    );

  y =
    drawWrappedText(
      page,
      `Phone: ${input.phone}`,
      {
        x:
          MARGIN,
        y,
        maxWidth:
          CONTENT_WIDTH,
        font:
          regularFont,
        fontSize:
          9,
        lineHeight:
          11,
      },
    );

  const addressParts = [
    input.address,
    input.city,
    input.state,
    input.pincode,
  ]
    .map(
      (part) =>
        safeText(part),
    )
    .filter(Boolean);

  y =
    drawWrappedText(
      page,
      addressParts.join(", "),
      {
        x:
          MARGIN,
        y,
        maxWidth:
          CONTENT_WIDTH,
        font:
          regularFont,
        fontSize:
          9,
        lineHeight:
          11,
      },
    );

  y -= 3;

  y =
    drawDivider(
      page,
      y,
    );

  y =
    drawWrappedText(
      page,
      "ITEMS",
      {
        x:
          MARGIN,
        y,
        maxWidth:
          CONTENT_WIDTH,
        font:
          boldFont,
        fontSize:
          9,
        lineHeight:
          11,
      },
    );

  y -= 2;

  const minimumFooterY =
    60;

  for (
    let index = 0;
    index < input.items.length;
    index += 1
  ) {
    const item =
      input.items[index];

    const details: string[] = [];

    if (item.variantLabel) {
      details.push(
        item.variantLabel,
      );
    }

    if (item.variantSku) {
      details.push(
        `SKU ${item.variantSku}`,
      );
    }

    const itemText =
      details.length > 0
        ? `${item.quantity} x ${item.productName} (${details.join(", ")})`
        : `${item.quantity} x ${item.productName}`;

    const lines =
      wrapText(
        itemText,
        regularFont,
        8.5,
        CONTENT_WIDTH,
      );

    const requiredHeight =
      Math.max(
        1,
        lines.length,
      ) * 10 + 2;

    if (
      y -
        requiredHeight <
      minimumFooterY
    ) {
      const remaining =
        input.items.length -
        index;

      y =
        drawWrappedText(
          page,
          `... ${remaining} more item${remaining === 1 ? "" : "s"}`,
          {
            x:
              MARGIN,
            y,
            maxWidth:
              CONTENT_WIDTH,
            font:
              boldFont,
            fontSize:
              8,
            lineHeight:
              10,
          },
        );

      break;
    }

    y =
      drawLines(
        page,
        lines,
        {
          x:
            MARGIN,
          y,
          font:
            regularFont,
          fontSize:
            8.5,
          lineHeight:
            10,
        },
      );

    y -= 2;
  }

  y =
    Math.max(
      y - 2,
      49,
    );

  y =
    drawDivider(
      page,
      y,
    );

  y =
    drawWrappedText(
      page,
      `TOTAL: INR ${input.totalAmount.toFixed(2)}`,
      {
        x:
          MARGIN,
        y,
        maxWidth:
          CONTENT_WIDTH,
        font:
          boldFont,
        fontSize:
          11,
        lineHeight:
          13,
      },
    );

  y -= 1;

  drawWrappedText(
    page,
    "PAYMENT: PAID   |   FULFILMENT: LOCAL",
    {
      x:
        MARGIN,
      y,
      maxWidth:
        CONTENT_WIDTH,
      font:
        boldFont,
      fontSize:
        7.5,
      lineHeight:
        9,
    },
  );

  return pdfDocument.save();
}
