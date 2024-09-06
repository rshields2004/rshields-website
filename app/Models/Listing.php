<?php
    namespace App\Models;

    class Listing {
        public static function all() {
            return [
                [
                    "id" => 1,
                    "title" => "listing one",
                    "description" => "Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Suspendisse semper porta nisl, eget eleifend arcu aliquet non. 
                    Cras placerat orci mollis risus convallis porttitor. Mauris at porta diam. 
                    Nulla non purus nunc. Ut vitae porta dui, a vestibulum dui. Nulla orci felis, malesuada non auctor scelerisque, lacinia in justo. 
                    Nam gravida vel dolor vitae laoreet. Duis gravida congue vestibulum. Cras lectus nisi, aliquet ac blandit sit amet, aliquam non felis. 
                    Nullam blandit sem nec turpis laoreet mollis."
                ],
                [
                    "id" => 2,
                    "title" => "listing two",
                    "description" => "Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Suspendisse semper porta nisl, eget eleifend arcu aliquet non. 
                    Cras placerat orci mollis risus convallis porttitor. Mauris at porta diam. 
                    Nulla non purus nunc. Ut vitae porta dui, a vestibulum dui. Nulla orci felis, malesuada non auctor scelerisque, lacinia in justo. 
                    Nam gravida vel dolor vitae laoreet. Duis gravida congue vestibulum. Cras lectus nisi, aliquet ac blandit sit amet, aliquam non felis. 
                    Nullam blandit sem nec turpis laoreet mollis."
                ]
                ];
        }

        public static function find($id) {
            $listings = self::all();
            foreach($listings as $listing) {
                if ($listing["id"] == $id) {
                    return $listing;
                }
            }
        }

    }