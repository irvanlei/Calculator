package com.calculator.controller;

import com.calculator.model.BinaryOperationRequest;
import com.calculator.model.CalculationResponse;
import com.calculator.model.PercentageRequest;
import com.calculator.model.PowerRequest;
import com.calculator.model.SqrtRequest;
import com.calculator.service.CalculatorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/calculator")
public class CalculatorController {

    private final CalculatorService calculatorService;

    public CalculatorController(CalculatorService calculatorService) {
        this.calculatorService = calculatorService;
    }

    @PostMapping("/add")
    public ResponseEntity<CalculationResponse> add(@Valid @RequestBody BinaryOperationRequest request) {
        return ResponseEntity.ok(calculatorService.add(request.a(), request.b()));
    }

    @PostMapping("/subtract")
    public ResponseEntity<CalculationResponse> subtract(@Valid @RequestBody BinaryOperationRequest request) {
        return ResponseEntity.ok(calculatorService.subtract(request.a(), request.b()));
    }

    @PostMapping("/multiply")
    public ResponseEntity<CalculationResponse> multiply(@Valid @RequestBody BinaryOperationRequest request) {
        return ResponseEntity.ok(calculatorService.multiply(request.a(), request.b()));
    }

    @PostMapping("/divide")
    public ResponseEntity<CalculationResponse> divide(@Valid @RequestBody BinaryOperationRequest request) {
        return ResponseEntity.ok(calculatorService.divide(request.a(), request.b()));
    }

    @PostMapping("/power")
    public ResponseEntity<CalculationResponse> power(@Valid @RequestBody PowerRequest request) {
        return ResponseEntity.ok(calculatorService.power(request.base(), request.exponent()));
    }

    @PostMapping("/sqrt")
    public ResponseEntity<CalculationResponse> sqrt(@Valid @RequestBody SqrtRequest request) {
        return ResponseEntity.ok(calculatorService.sqrt(request.value()));
    }

    @PostMapping("/percentage")
    public ResponseEntity<CalculationResponse> percentage(@Valid @RequestBody PercentageRequest request) {
        return ResponseEntity.ok(calculatorService.percentage(request.percent(), request.of()));
    }
}
