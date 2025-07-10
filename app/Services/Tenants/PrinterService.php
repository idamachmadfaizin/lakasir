<?php

namespace App\Services\Tenants;

use App\Models\Tenants\Printer;
use Illuminate\Support\Arr;

class PrinterService
{
    public function createOrUpdate(array $data): void
    {
        Printer::query()
            ->updateOrCreate([
                'id' => Printer::query()->first()?->getKey() ?? null,
            ], Arr::only($data, [
                'header', 'footer'
            ]));
    }
}
