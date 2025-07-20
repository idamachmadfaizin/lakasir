<?php

namespace App\Filament\Tenant\Pages;

use App\Services\Tenants\PrinterService;
use App\Traits\HasTranslatableResource;
use Filament\Actions\Action;
use Filament\Actions\Contracts\HasActions;
use Filament\Forms\Components;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Concerns\InteractsWithFormActions;
use Filament\Pages\Page;

class Printer extends Page implements HasActions, HasForms
{
    use HasTranslatableResource;
    use InteractsWithFormActions;

    protected static ?string $navigationIcon = 'heroicon-o-printer';

    protected static string $view = 'filament.tenant.pages.printer';

    public ?array $data = [];

    public function mount()
    {
        $print = \App\Models\Tenants\Printer::first()?->toArray();
        if ($print) {
            $this->data = $print;
        }
    }

    public function form(Form $form): Form
    {
        return $form->schema([
            Components\Textarea::make('header')
                ->rows(5)
                ->translateLabel(),
            Components\Textarea::make('footer')
                ->rows(5)
                ->translateLabel(),
        ])->statePath('data');
    }

    public function getFormActions(): array
    {
        return [
            Action::make('save')
                ->translateLabel()
                ->extraAttributes([
                    'x-on:click' => 'save',
                ]),
            Action::make('test')
                ->translateLabel()
                ->color('warning')
                ->icon('heroicon-o-printer')
                ->extraAttributes([
                    'x-on:click' => 'test',
                ]),
        ];
    }

    public function validateInput()
    {
    }

    //Save function
    public function save(PrinterService $printerService)
    {
        $printerService->createOrUpdate($this->data);

        Notification::make()
            ->title(__('Success'))
            ->success()
            ->send();

        $this->mount();
    }
}
