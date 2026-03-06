output "alb_arn" {
  value = aws_lb.main.arn
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "alb_zone_id" {
  value = aws_lb.main.zone_id
}

output "api_gateway_target_group_arn" {
  value = aws_lb_target_group.api_gateway.arn
}

output "http_listener_arn" {
  value = try(aws_lb_listener.http_forward[0].arn, aws_lb_listener.http.arn)
}
