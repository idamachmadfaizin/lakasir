<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('printers', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->dropColumn('driver');
            $table->dropColumn('port');
            $table->dropColumn('ip_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('printers', function (Blueprint $table) {
            $table->string('name')->after('id');
            $table->string('driver')->after('name');
            $table->string('port')->nullable()->after('driver');
            $table->string('ip_address')->nullable()->after('port');
        });
    }
};
