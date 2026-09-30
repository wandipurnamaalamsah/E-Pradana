<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Membuat tabel-tabel utama sistem e-voting: candidates, settings, voters, votes, dan audit_logs.
     */
    public function up(): void
    {
        // 1. Tabel Kandidat (Candidates)
        if (!Schema::hasTable('candidates')) {
            Schema::create('candidates', function (Blueprint $table) {
                $table->id();
                $table->enum('category', ['putra', 'putri']);
                $table->unsignedSmallInteger('candidate_number');
                $table->string('name');
                $table->string('class', 50)->nullable();
                $table->text('vision')->nullable();
                $table->text('mission')->nullable();
                $table->string('photo_url')->nullable();
                $table->boolean('is_blank')->default(false);
                $table->timestamps();

                $table->unique(['category', 'candidate_number'], 'candidates_category_number_unique');
            });
        }

        // 2. Tabel Pengaturan Pemilihan (Settings)
        if (!Schema::hasTable('settings')) {
            Schema::create('settings', function (Blueprint $table) {
                $table->unsignedTinyInteger('id')->default(1)->primary();
                $table->enum('status', ['draft', 'rehearsal', 'open', 'closed'])->default('draft');
                $table->dateTime('start_at')->nullable();
                $table->dateTime('end_at')->nullable();
                $table->boolean('schedule_enabled')->default(false);
                $table->boolean('manual_override')->default(false);
                $table->boolean('results_revealed')->default(false);
                $table->boolean('allow_blank')->default(false);
                $table->foreignId('decided_putra_id')->nullable()->constrained('candidates')->restrictOnDelete();
                $table->foreignId('decided_putri_id')->nullable()->constrained('candidates')->restrictOnDelete();
                $table->timestamp('updated_at')->nullable();
            });
        }

        // 3. Tabel Pemilih / DPT (Voters)
        if (!Schema::hasTable('voters')) {
            Schema::create('voters', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('class', 50)->index();
                $table->string('username', 100)->unique();
                $table->string('token', 20)->nullable();
                $table->char('token_hash', 64)->nullable();
                $table->boolean('has_voted')->default(false);
                $table->timestamp('created_at')->nullable();
            });
        }

        // 4. Tabel Kotak Suara Digital (Votes - Tanpa Relasi ID Pemilih)
        if (!Schema::hasTable('votes')) {
            Schema::create('votes', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->foreignId('candidate_putra_id')->constrained('candidates')->restrictOnDelete();
                $table->foreignId('candidate_putri_id')->constrained('candidates')->restrictOnDelete();
            });
        }

        // 5. Tabel Audit Log (Audit Logs)
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->restrictOnDelete();
                $table->string('action', 50)->nullable();
                $table->json('meta')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['action', 'created_at'], 'audit_logs_action_created_at_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('votes');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('voters');
        Schema::dropIfExists('candidates');
    }
};
