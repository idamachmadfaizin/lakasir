class ThermalPrinter {
  constructor() {
    this.content = [];
    this.sizes = {
      small: '9px',
      normal: '11px',
      large: '13px'
    };
    this.styles = {
      'text-align': 'left',
      'font-weight': 'normal',
      'text-decoration': 'none',
      'font-size': this.sizes.normal,
      'line-height': '1.0'
    };
    this.config = {
      width: '4in',    // 4-inch width
      maxWidth: '4in',
      fontFamily: 'monospace' // Better for receipt-like printing
    };
  }

  // Add text with optional alignment
  text(content = '', align = 'left') {
    this.content.push({
      type: 'text',
      content: content.replaceAll('\n\r', '<br>').replaceAll('\n', '<br>'),
      styles: {
        ...this.styles,
        'text-align': align
      }
    });
    return this;
  }

  // Add line breaks
  newLine(lines = 1) {
    for (let i = 0; i < lines; i++) {
      this.content.push({ type: 'lineBreak' });
    }
    return this;
  }

  // Add horizontal rule
  hr() {
    this.content.push({
      type: 'hr',
      styles: {
        ...this.styles
      }
    });
    return this;
  }

  // Set bold style
  bold(enabled = true) {
    this.styles['font-weight'] = enabled ? 'bold' : 'normal';
    return this;
  }

  // Set underline style
  underline(enabled = true) {
    this.styles['text-decoration'] = enabled ? 'underline' : 'none';
    return this;
  }

  // Set text size
  size(size = 'normal') {
    this.styles['font-size'] = this.sizes[size] || this.sizes.normal;
    return this;
  }

  // Add a table row (for receipt items)
  tableRow(cells = [], widths = []) {
    this.content.push({
      type: 'tableRow',
      cells,
      widths,
      styles: {
        ...this.styles
      }
    });
    return this;
  }

  // Generate HTML from content
  generateHTML() {
    console.log({content: this.content})
    const elements = this.content.map(item => {
      switch (item.type) {
        case 'text':
          return `<div style="${this.getStyleString(item.styles)}">${item.content}</div>`;
        case 'lineBreak':
          return '<br>';
        case 'hr':
          return `<hr style="${this.getStyleString(item.styles)}">`;
        case 'tableRow':
          const cells = item.cells.map((cell, i) =>
            `<td style="width:${item.widths[i] || 'auto'}; ${this.getStyleString({...item.styles, ...{'text-align': Number.isInteger(cell) ? 'right' : 'left'}})}; vertical-align: baseline;">${moneyFormat(cell)}</td>`
          );
          return `<table style="width:100%"><tr>${cells.join('')}</tr></table>`;
        default:
          return '';
      }
    });

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Thermal Print</title>
        <style>
            body {
              width: ${this.config.width};
              max-width: ${this.config.maxWidth};
              margin: 0;
              padding: 0;
              font-family: ${this.config.fontFamily};
              line-height: ${this.styles['line-height']};
            }
            hr {
              border: 0;
              border-top: 1px dashed #000;
              margin: 5px 0;
            }
        </style>
      </head>
      <body>
        ${elements.join('')}
      </body>
      </html>
    `;
  }

  // Helper to convert style object to string
  getStyleString(styles) {
    return Object.entries(styles)
      .map(([key, value]) => `${key}:${value}`)
      .join(';');
  }

  // Print the generated HTML
  print() {
    const html = this.generateHTML();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();

    // Delay print to ensure content loads
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 200);
  }
}
