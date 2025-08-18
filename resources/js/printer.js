class Printer {
  constructor(printerId) {
    console.log(this.commands);
    this.commands = '';
    this.lineWidth = 32;
    this.printerId = printerId;
  }

  async print() {
    const commands = this.getCommands();
    console.log(commands)
    try {
      const devices = await navigator.usb.getDevices();
      const device = devices.find(device => device.vendorId === this.printerId);
      if (device) {
        await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);

        const encoder = new TextEncoder();
        const data = encoder.encode(commands);
        const endpoint = device.configuration.interfaces[0].alternate.endpoints.filter(endpoint => endpoint.direction === 'out')[0]
        await device.transferOut(endpoint.endpointNumber, data);
        await device.close();
        console.log('Data sent to printer');
        this.clearCommands();
      } else {
        console.log('No USB device with the specified vendor ID found');
        new FilamentNotification()
          .title('You should choose the printer first in printer setting')
          .danger()
          .actions([
            new FilamentNotificationAction('Setting')
              .icon('heroicon-o-cog-6-tooth')
              .button()
              .url('/member/printer'),
          ])
          .send()
      }
    } catch (e) {
      console.error(e);
    }
  }

  addCommand(command) {
    this.commands += command;
  }

  font(font) {
    const fonts = {
      'a': '\x1b\x4d\x00', // Font A
      'b': '\x1b\x4d\x01'  // Font B
    };
    this.addCommand(fonts[font]);
    return this;
  }

  align(align) {
    const alignments = {
      'left': '\x1b\x61\x00',
      'center': '\x1b\x61\x01',
      'right': '\x1b\x61\x02'
    };
    this.addCommand(alignments[align]);
    return this;
  }

  style(style) {
    const styles = {
      'bold': '\x1b\x45\x01',
      'underline': '\x1b\x2d\x01',
      'normal': '\x1b\x45\x00' + '\x1b\x2d\x00'
    };
    this.addCommand(styles[style ?? 'normal']);
    return this;
  }

  size(width, height) {
    this.addCommand('\x1d\x21' + String.fromCharCode((width << 4) | height));
    return this;
  }

  text(text) {
    this.addCommand(text + '\n');
    return this;
  }

  barcode(code, type) {
    const types = {
      'EAN8': '\x1d\x6b\x02'
    };
    this.addCommand(types[type] + code + '\x00');
    return this;
  }

  table(data) {
    let row = '';
    const totalTextLength = data.reduce((sum, text) => sum + text.length, 0);

    const totalPadding = this.lineWidth - totalTextLength;
    data.forEach((text, index) => {
      row += text;
      if (index < data.length) {
        for (let i = 0; i < totalPadding; i++) {
          row += ' ';
        }
      }
    });

    this.addCommand(row.trim() + '\x0A');
    return this;
  }

  tableCustom(data) {
    const totalTextLength = data.reduce((sum, text) => sum + text.text.length, 0);

    const totalPadding = this.lineWidth - totalTextLength;
    let row = '';

    data.forEach((cell, index) => {
      let style = cell.style === 'B' ? '\x1b\x45\x01' : '\x1b\x45\x00';

      row += style + cell.text;
      if (index < data.length) {
        for (let i = 0; i < totalPadding; i++) {
          row += ' ';
        }
      }
    });

    this.addCommand(row.trim() + '\x0A');
    return this;
  }

  newLine(line = 1) {
    for (let i = 0; i < line; i++) {
      this.text('\n');
    }

    return this;
  }

  cut() {
    this.addCommand('\n\n' + '\x1d\x56\x00');
    return this;
  }

  getCommands() {
    return this.commands;
  }

  clearCommands() {
    this.commands = '';
  }
}

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
      'line-height': '1.0',
      'margin-top': '.2rem',
      'margin-bottom': '.2rem',
    };
    this.config = {
      width: '2.95in',    // 4-inch width
      maxWidth: '2.95in',
      fontFamily: 'monospace', // Better for receipt-like printing
      uppercase: false,
    };
  }

  uppercase() {
    this.config.uppercase = true;
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
      this.content.push({type: 'lineBreak'});
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
  tableRow(cells = [], widths = [], aligns = []) {
    this.content.push({
      type: 'tableRow',
      cells,
      widths,
      aligns,
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
          return `<p style="${this.getStyleString(item.styles)}">${item.content}</p>`;
        case 'lineBreak':
          return '<br>';
        case 'hr':
          return `<hr style="${this.getStyleString(item.styles)}">`;
        case 'tableRow':
          const cells = item.cells.map((cell, i) => {
            const width = item.widths[i] || 'auto';
            const textAlign = item.aligns[i] || 'left';

            return `<td style="width:${width}; ${this.getStyleString({...item.styles, ...{'text-align': textAlign}})}; vertical-align: baseline;">${cell}</td>`;
          });
          return `<table style="width:100%;"><tr>${cells.join('')}</tr></table>`;
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
              text-transform: ${this.config.uppercase ? 'uppercase' : 'none'};
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
    // setTimeout(() => {
    //   printWindow.print();
    //   printWindow.close();
    // }, 200);
  }
}
