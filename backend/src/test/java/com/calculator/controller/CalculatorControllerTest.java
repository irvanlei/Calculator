package com.calculator.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class CalculatorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/v1/calculator/add returns calculated sum")
    void addEndpointReturnsSum() throws Exception {
        mockMvc.perform(post("/api/v1/calculator/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"a\": 12.5, \"b\": 7.5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operation").value("ADDITION"))
                .andExpect(jsonPath("$.result").value(20))
                .andExpect(jsonPath("$.expression").value("12.5 + 7.5"));
    }

    @Test
    @DisplayName("POST /api/v1/calculator/subtract returns difference")
    void subtractEndpointReturnsDifference() throws Exception {
        mockMvc.perform(post("/api/v1/calculator/subtract")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"a\": 50, \"b\": 18}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operation").value("SUBTRACTION"))
                .andExpect(jsonPath("$.result").value(32));
    }

    @Test
    @DisplayName("POST /api/v1/calculator/multiply returns product")
    void multiplyEndpointReturnsProduct() throws Exception {
        mockMvc.perform(post("/api/v1/calculator/multiply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"a\": 7, \"b\": 6}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operation").value("MULTIPLICATION"))
                .andExpect(jsonPath("$.result").value(42));
    }

    @Test
    @DisplayName("POST /api/v1/calculator/divide returns quotient")
    void divideEndpointReturnsQuotient() throws Exception {
        mockMvc.perform(post("/api/v1/calculator/divide")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"a\": 100, \"b\": 4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operation").value("DIVISION"))
                .andExpect(jsonPath("$.result").value(25));
    }

    @Test
    @DisplayName("POST /api/v1/calculator/divide with zero divisor returns 400 error JSON")
    void divideByZeroReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/calculator/divide")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"a\": 10, \"b\": 0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("DIVISION_BY_ZERO"))
                .andExpect(jsonPath("$.message").value("Division by zero is not allowed."))
                .andExpect(jsonPath("$.path").value("/api/v1/calculator/divide"));
    }

    @Test
    @DisplayName("POST /api/v1/calculator/power returns exponentiation result")
    void powerEndpointReturnsResult() throws Exception {
        mockMvc.perform(post("/api/v1/calculator/power")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"base\": 2, \"exponent\": 10}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operation").value("EXPONENTIATION"))
                .andExpect(jsonPath("$.result").value(1024));
    }

    @Test
    @DisplayName("POST /api/v1/calculator/sqrt returns square root and rejects negative input")
    void sqrtEndpointWorksAndRejectsNegative() throws Exception {
        mockMvc.perform(post("/api/v1/calculator/sqrt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": 81}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operation").value("SQUARE_ROOT"))
                .andExpect(jsonPath("$.result").value(9));

        mockMvc.perform(post("/api/v1/calculator/sqrt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": -16}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("NEGATIVE_SQUARE_ROOT"));
    }

    @Test
    @DisplayName("POST /api/v1/calculator/percentage supports standalone and base percentage")
    void percentageEndpointWorks() throws Exception {
        mockMvc.perform(post("/api/v1/calculator/percentage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"percent\": 25}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(0.25));

        mockMvc.perform(post("/api/v1/calculator/percentage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"percent\": 20, \"of\": 150}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(30));
    }

    @Test
    @DisplayName("Missing required fields and malformed JSON return structured 400 validation errors")
    void invalidPayloadsReturnStructuredBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/calculator/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"a\": 5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.b").value("Operand 'b' is required."));

        mockMvc.perform(post("/api/v1/calculator/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"a\": \"not-a-number\", \"b\": 2}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST_BODY"));
    }
}
