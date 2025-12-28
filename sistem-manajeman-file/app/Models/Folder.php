<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Folder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'folder_hash', 'division_id', 'user_id', 'parent_folder_id',
    ];

    /**
     * Boot method - Auto-generate hash before creating folder
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-generate hash before creating (ALWAYS runs, no cache issue)
        static::creating(function ($folder) {
            if (empty($folder->folder_hash)) {
                $folder->folder_hash = self::generateFolderHash();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Folder::class, 'parent_folder_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Folder::class, 'parent_folder_id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(File::class);
    }

    public function getFullPath(): string
    {
        $this->loadMissing('division', 'parent');
        $pathParts = [];
        $current = $this;
        while ($current) {
            // Use random hash from database (like file uploads)
            $folderIdentifier = $current->folder_hash ?: Str::slug($current->name, '-');
            array_unshift($pathParts, $folderIdentifier);
            $current = $current->parent; 
        }
        // Use division name slug (readable) instead of ID
        $divisionSlug = $this->division ? Str::slug($this->division->name, '-') : 'divisi-tidak-diketahui';
        return 'uploads/' . $divisionSlug . '/' . implode('/', $pathParts);
    }

    /**
     * Generate unique random hash for folder (like file uploads)
     */
    public static function generateFolderHash(): string
    {
        // Generate random string like Laravel's file upload hash (40 chars)
        return Str::random(40);
    }

    public function getRecursiveSize(): int
    {
        $size = $this->files()->sum('ukuran_file');
        foreach ($this->children()->with('children', 'files')->get() as $child) {
            $size += $child->getRecursiveSize();
        }
        return $size;
    }

    public function getBreadcrumbs()
    {
        $this->loadMissing('parent');
        $breadcrumbs = collect();
        $current = $this;
        while ($current) {
            $breadcrumbs->prepend($current->only(['id', 'name']));
            $current = $current->parent;
        }
        return $breadcrumbs->values();
    }
}