<x-filament-panels::page>
  <div x-data="printer">
    <x-filament-panels::form
      x-ref="printerForm"
      id="form"
      wire:key="{{ 'forms.' . $this->getFormStatePath() }}">
      {{ $this->form }}

    <x-filament-panels::form.actions
      :actions="$this->getCachedFormActions()"
      :full-width="$this->hasFullWidthFormActions()"
      />
    </x-filament-panels::form>
  </div>
</x-filament-panels::page>
@script()
  <script>
    Alpine.data('printer', () => ({
      // init() {
      //   if(localStorage.printer) {
      //     const printer = JSON.parse(localStorage.printer);
      //     $wire.data = {
      //       ...printer
      //     }
      //   }
      // },
      fetchDeviceByDriver() {
        if($wire.data.driver == 'bluetooth') {
          this.fetchBluetooth();
        }
        if($wire.data.driver == 'usb') {
          this.fetchTheUsb();
        }
      },
      async fetchTheUsb() {
        let selectedDevice = null;
        try {
          selectedDevice = await navigator.usb.requestDevice({ filters: [] });
          await selectedDevice.open();
          await selectedDevice.selectConfiguration(1);
          // await selectedDevice.claimInterface(0);
          for (let i = 0; i < 4; i++) {
            try {
              await selectedDevice.claimInterface(i);
              console.log(`Claimed interface ${i}`);
              break;
            } catch (e) {
              console.log(`Interface ${i} not available`);
            }
          }
          $wire.data.printer = selectedDevice.productName;
          $wire.data.printerId = selectedDevice.vendorId;
          console.log('USB printer selected:', selectedDevice.productName);
        } catch (error) {
          console.error(error);
        }
      },
      async fetchBluetooth() {},
      save() {
        $wire.validate();
        localStorage.setItem("printer", JSON.stringify({
          ...$wire.data,
        }));
        $wire.save();
      },
      async test() {
        try {
          $wire.validate();
          console.log($wire.data.header);
          if(!$wire.data.header) {
            return;
          }

          const printer = new ThermalPrinter();

          printer
            .size('large')
            .text($wire.data.header, 'center')
            .size('normal')
            .newLine()
            .text('Receipt: 12345')
            .text(`@lang('Date'): ${new Date().toLocaleString()}`)
            // .newLine()
            // .hr()
            //
            // // Table rows for items
            // .tableRow(
            //   ['Item', 'Qty', 'Price', 'Total'],
            //   ['50%', '3%']
            // )
            .hr()
            .tableRow(
              ['Product 1', 2, 100_000, 200_000],
              ['50%', '3%']
            )
            .tableRow(
              ['Product 2', 3, 1_000_000, 3_000_000],
              ['50%', '3%']
            )
            .hr()

            .bold()
            .tableRow(
              ['TOTAL', 3_200_000],
            )
            .bold(false)

            .newLine(2)
            .text('Thank you for your business!', 'center')
            .newLine(3);

          printer.print();
        } catch (e) {
          console.error(e);
        }
      },
    }))
  </script>
@endscript
