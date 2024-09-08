<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // Show create form

    public function create() {
        return view("users.create");
    }

    public function store() {
        $formFields = request()->validate([
            "name" => ["required", "min:3"],
            "email" => ["required", "email", Rule::unique("users", "email")],
            "password" => ["required", "confirmed", "min:6"]
        ]);

        $formFields["password"] = bcrypt($formFields["password"]);

        $user = User::create($formFields);

        auth()->login($user);

        return redirect("/")->with("message", "User registered and logged in");

    }

    public function logout() {
        auth()->logout();

        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect("/")->with("message", "Logged out successfully");

    }

    public function login() {
        return view("users.login");
    }

    public function authenticate() {
        $formFields = request()->validate([
            "email" => ["required", "email"],
            "password" => "required"
        ]);

        if (auth()->attempt($formFields)) {
            request()->session()->regenerate();

            return redirect("/")->with("message", "Logged in successfully.");
        }
        else {
            return back()->withErrors(["email" => "Invalid Credentials"])->onlyInput("email");
        }


    }


}
