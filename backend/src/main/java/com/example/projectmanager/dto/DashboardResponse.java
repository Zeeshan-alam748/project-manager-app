package com.example.projectmanager.dto;

import java.util.Map;

public record DashboardResponse(long projects, long tasks, long members, Map<String, Long> byStatus) {
}

