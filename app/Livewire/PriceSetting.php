<?php

namespace App\Livewire;

use App\Filament\Tenant\Resources\Traits\RefreshThePage;
use App\Models\Tenants\CartItem;
use Livewire\Component;

class PriceSetting extends Component
{
    use RefreshThePage;

    public CartItem $cartItem;

    private $prevUnit;
    public $unit;

    public function changeThePrice(): void
    {
        $this->prevUnit = $this->unit;
        $this->cartItem->update([
            'price_unit_id' => $this->unit,
        ]);

        $this->refreshPage();

        $this->dispatch('close-modal', id : "price-setting-{$this->cartItem->id}");
    }

    public function removeThePrice(): void
    {
        $this->prevUnit = null;
        $this->cartItem->update([
            'price_unit_id' => null,
        ]);
        $this->unit = null;

        $this->refreshPage();

        $this->dispatch('close-modal', id : "price-setting-{$this->cartItem->id}");
    }

    public function modalClosed(): void
    {
        $this->unit = $this->prevUnit;
    }

    public function render()
    {
        return view('livewire.price-setting');
    }
}
