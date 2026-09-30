<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voter extends Model
{
    public $timestamps = false;

    protected $table = 'voters';

    protected $fillable = [
        'name',
        'class',
        'username',
        'token',
        'token_hash',
        'has_voted',
        'created_at',
    ];

    protected $casts = [
        'has_voted' => 'boolean',
        'created_at' => 'datetime',
    ];
}
