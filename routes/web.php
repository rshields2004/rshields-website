<?php

use App\Models\Listing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ListingController;

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

Route::get("/listings/create", [ListingController::class, "create"])->middleware("auth");

//Store a new listing

Route::post("/listings", [ListingController::class, "store"])->middleware("auth");

//SHow edit form

Route::get("listings/{listing}/edit", [ListingController::class, "edit"])->middleware("auth");

//Edit submit

Route::put("listings/{listing}", [ListingController::class, "update"])->middleware("auth");

//Destroy listing

Route::delete("listings/{listing}", [ListingController::class, "destroy"])->middleware("auth");

//Show users listings

Route::get("/listings/manage", [ListingController::class, "manage"])->middleware("auth");

//SIngle listing - must be at bottom

Route::get("/listings/{listing}", [ListingController::class, "show"]);

//Show user create form

Route::get("/register", [UserController::class, "create"])->middleware("guest");

//Store a new user

Route::post("/users", [UserController::class, "store"])->middleware("guest");

//Logout

Route::post("/logout", [UserController::class, "logout"])->middleware("auth");

//Show login form

Route::get("/login", [UserController::class, "login"])->name("login")->middleware("guest");

//Submit the login form

Route::post("/users/authenticate", [UserController::class, "authenticate"])->middleware("guest");
