package com.example.visitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VisitorManagementApplication {

	public static void main(String[] args) {
		// Force ddl-auto=none regardless of any env var — never let Hibernate touch the DB schema
		System.setProperty("spring.jpa.hibernate.ddl-auto", "none");
		SpringApplication.run(VisitorManagementApplication.class, args);
	}

}
