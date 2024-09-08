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

        $formFields["user_id"] = auth()->id();

        Listing::create($formFields);

        return redirect("/")->with("message", "Listing created successfully.");
    }

    public function edit(Listing $listing) {
        return view("listings.edit", ["listing" => $listing]);
    }

    public function update(Listing $listing) {

        //Ensure that user owns listing first

        if ($listing->user_id != auth()->id()) {
            abort(403, "Unauthorised");
        }

        $formFields = request()->validate([
            "title" => "required",
            "company" => "required",
            "location" => "required",
            "website" => "required",
            "email" => ["required", "email"],
            "tags" => "required",
            "description" => "required"
        ]);

        if (request()->hasFile("logo")) {
            $formFields["logo"] = request()->file("logo")->store("logos", "public");
        }

        $listing->update($formFields);

        return back()->with("message", "Listing updated successfully.");
    }

    public function destroy(Listing $listing) {
        
        if ($listing->user_id != auth()->id()) {
            abort(403, "Unauthorised");
        }
        
        $listing->delete();
        return redirect("/")->with("message", "Listing deleted successfully.");
    }

    public function manage() {
        return view("listings.manage", ["listings" =>auth()->user()->listing()->get()]);
    }

}
