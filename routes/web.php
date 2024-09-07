<?php

use App\Http\Controllers\ListingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Listing;

// Common resource routes/naming
// index - show all listings
// show - show single listing
// create - show form to create new listing
// store - store new listing
// edit - show form to edit listing
// update - update listing
// destroy - destroy listing


//All listings

Route::get('/', [ListingController::class, "index"]);




//Show create form

Route::get("/listings/create", [ListingController::class, "create"]);

//Store a new listing

Route::post("/listings", [ListingController::class, "store"]);

//SIngle listing - must be at bottom

Route::get("/listings/{listing}", [ListingController::class, "show"]);

