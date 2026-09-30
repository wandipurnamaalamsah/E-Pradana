<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE audit_logs MODIFY COLUMN action ENUM(
            'open_election',
            'force_open',
            'auto_open',
            'auto_open_failed',
            'close_election',
            'force_close',
            'auto_close',
            'reopen_emergency',
            'reveal',
            'announce_winner',
            'tie_decision',
            'update_schedule',
            'update_settings',
            'import_dpt',
            'add_voter',
            'print_cards',
            'regenerate_token',
            'reset_token',
            'reset_database',
            'reset_election',
            'create_admin',
            'disable_admin'
        )");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
