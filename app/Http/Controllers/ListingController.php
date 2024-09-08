<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ListingController extends Controller
{
    //Get and show all listings
    public function index() {
        return view("listings.index", [
            "listings" => Listing::latest()->filter(request(["tag", "search"]))->paginate(6)
        ]);
    }

    //Get and show a single listing
    public function show(Listing $listing) {
        return view("listings.show", [
            "listing" => $listing
        ]);
    }

    public function create() {
        return view("listings.create"); 
    }

    public function store() {
        $formFields = request()->validate([
            "title" => "required",
            "company" => ["required", Rule::unique("listings", "company")],
            "location" => "required",
            "website" => "required",
            "email" => ["required", "email"],
            "tags" => "required",
            "description" => "required"
        ]);

        if (request()->hasFile("logo")) {
            $formFields["logo"] = request()->file("logo")->store("logos", "public");
        }

        Listing::create($formFields);

        return redirect("/")->with("message", "Listing created successfully.");
    }

}
